import {
  AnglerConditions,
  ANGLER_SYSTEM_INSTRUCTION,
  buildConditionsContext,
  generateHeuristicAdvice,
} from './anglerAdvice';

export type AdviceSource = 'gemini' | 'server' | 'heuristics';

export interface AdviceResult {
  advice: string;
  source: AdviceSource;
  /** Present when a configured Gemini key was rejected or the call failed. */
  error?: string;
}

const KEY_STORAGE = 'anglers_gemini_api_key_v1';
const MODEL_STORAGE = 'anglers_gemini_model_v1';
const GENAI_BASE = 'https://generativelanguage.googleapis.com/v1beta/models';
const MODEL_CANDIDATES = ['gemini-3.7-flash', 'gemini-flash-latest', 'gemini-2.5-flash'];
const AI_EVENT = 'anglers_gemini_key_updated';

export function getGeminiApiKey(): string {
  if (typeof window === 'undefined') return '';
  return localStorage.getItem(KEY_STORAGE)?.trim() ?? '';
}

export function setGeminiApiKey(key: string): void {
  if (typeof window === 'undefined') return;
  const trimmed = key.trim();
  if (trimmed) {
    localStorage.setItem(KEY_STORAGE, trimmed);
  } else {
    localStorage.removeItem(KEY_STORAGE);
  }
  window.dispatchEvent(new CustomEvent(AI_EVENT, { detail: trimmed }));
}

export function subscribeToGeminiKeyChanges(callback: (key: string) => void): () => void {
  if (typeof window === 'undefined') return () => {};
  const handler = () => callback(getGeminiApiKey());
  window.addEventListener(AI_EVENT, handler);
  window.addEventListener('storage', handler);
  return () => {
    window.removeEventListener(AI_EVENT, handler);
    window.removeEventListener('storage', handler);
  };
}

export function getGeminiModel(): string {
  if (typeof window === 'undefined') return MODEL_CANDIDATES[0];
  return localStorage.getItem(MODEL_STORAGE)?.trim() || MODEL_CANDIDATES[0];
}

function modelsToTry(): string[] {
  const preferred = getGeminiModel();
  return [preferred, ...MODEL_CANDIDATES.filter((m) => m !== preferred)];
}

interface GenerateContentResponse {
  candidates?: { content?: { parts?: { text?: string }[] } }[];
  error?: { message?: string };
}

function extractText(payload: GenerateContentResponse): string {
  const parts = payload.candidates?.[0]?.content?.parts ?? [];
  return parts
    .map((part) => part.text ?? '')
    .join('')
    .trim();
}

async function callGemini(
  apiKey: string,
  prompt: string,
  conditions: AnglerConditions | undefined,
  signal?: AbortSignal,
): Promise<{ text: string } | { error: string }> {
  const body = JSON.stringify({
    systemInstruction: { parts: [{ text: ANGLER_SYSTEM_INSTRUCTION }] },
    contents: [{ role: 'user', parts: [{ text: `${prompt}${buildConditionsContext(conditions)}` }] }],
    generationConfig: { temperature: 0.7 },
  });

  let lastError = 'Gemini request failed';

  for (const model of modelsToTry()) {
    let payload: GenerateContentResponse;
    try {
      const res = await fetch(`${GENAI_BASE}/${encodeURIComponent(model)}:generateContent`, {
        method: 'POST',
        signal,
        headers: { 'Content-Type': 'application/json', 'x-goog-api-key': apiKey },
        body,
      });
      payload = (await res.json()) as GenerateContentResponse;
      if (!res.ok) {
        lastError = payload.error?.message || `Gemini HTTP ${res.status}`;
        // Unknown/unsupported model: try the next candidate. Anything else is fatal.
        if (res.status === 404 || res.status === 400) continue;
        return { error: lastError };
      }
    } catch (err) {
      if (signal?.aborted) throw err;
      return { error: err instanceof Error ? err.message : 'Gemini request failed' };
    }

    const text = extractText(payload);
    if (text) return { text };
    lastError = 'Gemini returned an empty response';
  }

  return { error: lastError };
}

async function callServer(
  prompt: string,
  conditions: AnglerConditions | undefined,
  signal?: AbortSignal,
): Promise<{ advice: string; source: AdviceSource } | undefined> {
  try {
    const res = await fetch('/api/gemini/advice', {
      method: 'POST',
      signal,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt, conditions }),
    });
    if (!res.ok) return undefined;
    if (!res.headers.get('content-type')?.includes('application/json')) return undefined;
    const data = (await res.json()) as { advice?: string; source?: string };
    const advice = data.advice?.trim();
    if (!advice) return undefined;
    // The route answers with its own heuristic engine when no server key is configured;
    // callers rely on the distinction to substitute their own factual fallback text.
    const isHeuristic = (data.source ?? '').startsWith('heuristics');
    return { advice, source: isHeuristic ? 'heuristics' : 'server' };
  } catch {
    // Static hosting has no Express route; fall through to the local engine.
    return undefined;
  }
}

/**
 * Resolves angler advice with graceful degradation: a browser-side Gemini call when the
 * user has stored their own key, otherwise the Express route when one is reachable, and
 * finally the bundled tactical engine so briefings always render on static hosting.
 */
export async function requestAnglerAdvice(
  prompt: string,
  conditions?: AnglerConditions,
  signal?: AbortSignal,
): Promise<AdviceResult> {
  const apiKey = getGeminiApiKey();

  if (apiKey) {
    const result = await callGemini(apiKey, prompt, conditions, signal);
    if ('text' in result) return { advice: result.text, source: 'gemini' };
    return {
      advice: generateHeuristicAdvice(prompt, conditions),
      source: 'heuristics',
      error: result.error,
    };
  }

  const server = await callServer(prompt, conditions, signal);
  if (server) return { advice: server.advice, source: server.source };

  return { advice: generateHeuristicAdvice(prompt, conditions), source: 'heuristics' };
}
