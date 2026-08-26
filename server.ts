import express from 'express';
import path from 'path';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';
import { createServer as createViteServer } from 'vite';
import {
  ANGLER_SYSTEM_INSTRUCTION,
  buildConditionsContext,
  generateHeuristicAdvice,
} from './src/utils/anglerAdvice';

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '10mb' }));

// Lazy initialization for Gemini API client
let aiClient: GoogleGenAI | null = null;
function getAIClient(): GoogleGenAI | null {
  if (!aiClient && process.env.GEMINI_API_KEY) {
    aiClient = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
  return aiClient;
}

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

// In-memory conversation state for cross-device sync (Desktop <-> Android)
interface SyncedMessage {
  id: string;
  question: string;
  answer?: string;
  timestamp: string;
}
let syncedConversations: SyncedMessage[] = [];

// Get Synced Conversations
app.get('/api/ai/conversation', (req, res) => {
  res.json({ messages: syncedConversations });
});

// Save / Append Synced Message
app.post('/api/ai/conversation', (req, res) => {
  const { message, messages } = req.body;
  if (Array.isArray(messages)) {
    syncedConversations = messages;
  } else if (message && message.id) {
    const existingIndex = syncedConversations.findIndex((m) => m.id === message.id);
    if (existingIndex >= 0) {
      syncedConversations[existingIndex] = message;
    } else {
      syncedConversations.push(message);
    }
  }
  // Keep last 30 messages
  if (syncedConversations.length > 30) {
    syncedConversations = syncedConversations.slice(-30);
  }
  res.json({ success: true, messages: syncedConversations });
});

// Clear Synced Conversations
app.delete('/api/ai/conversation', (req, res) => {
  syncedConversations = [];
  res.json({ success: true, messages: [] });
});

// Delete a single message from synced conversation
app.delete('/api/ai/conversation/:id', (req, res) => {
  const { id } = req.params;
  const { messages } = req.body;
  if (Array.isArray(messages)) {
    syncedConversations = messages;
  } else {
    syncedConversations = syncedConversations.filter((m) => m.id !== id);
  }
  res.json({ success: true, messages: syncedConversations });
});

// AI Fishing Advice Endpoint
app.post('/api/gemini/advice', async (req, res) => {
  try {
    const { prompt, conditions } = req.body;

    if (!prompt || typeof prompt !== 'string' || prompt.trim().length === 0) {
      return res.status(400).json({ error: 'Prompt is required' });
    }

    const ai = getAIClient();

    if (ai) {
      const systemInstruction = ANGLER_SYSTEM_INSTRUCTION;
      const contextData = buildConditionsContext(conditions);

      try {
        const aiPromise = ai.models.generateContent({
          model: 'gemini-3.7-flash',
          contents: `${prompt}${contextData}`,
          config: {
            systemInstruction,
            temperature: 0.7,
          },
        });

        const timeoutPromise = new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('AI generation timed out after 6 seconds')), 6000)
        );

        const response = await Promise.race([aiPromise, timeoutPromise]);

        if (response && response.text && response.text.trim().length > 0) {
          return res.json({ advice: response.text.trim(), source: 'gemini' });
        }
      } catch (geminiErr: any) {
        console.warn('Gemini API call warning, falling back to local pro engine:', geminiErr?.message);
      }
    }

    // Fallback heuristic response if API key is not configured or fails
    const fallbackResponse = generateHeuristicAdvice(prompt, conditions);
    res.json({ advice: fallbackResponse, source: 'heuristics' });
  } catch (error: any) {
    console.error('Error generating AI advice:', error);
    const fallback = generateHeuristicAdvice(req.body?.prompt || '', req.body?.conditions);
    res.json({ advice: fallback, source: 'heuristics-fallback', error: error?.message });
  }
});


async function startServer() {
  // Vite middleware in dev, static dist in production
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true, host: '0.0.0.0', port: PORT },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Angler's Daily Dashboard server running on http://localhost:${PORT}`);
  });
}

startServer();
