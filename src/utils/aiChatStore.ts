import { LakeHydrologyData } from './lakeHydrology';

export interface SyncedChatMessage {
  id: string;
  question: string;
  answer?: string;
  timestamp: string;
  isLoading?: boolean;
}

const STORAGE_KEY = 'anglers_ai_advisor_synced_chat_v1';
const SYNC_EVENT = 'anglers_ai_chat_updated';

// In-memory cache
let cachedMessages: SyncedChatMessage[] = [];
let isInitialized = false;

export function getLocalChatHistory(): SyncedChatMessage[] {
  if (typeof window === 'undefined') return [];
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      cachedMessages = JSON.parse(saved);
      return cachedMessages;
    }
  } catch (e) {
    console.warn('Failed to parse local AI chat history:', e);
  }
  return cachedMessages;
}

export function saveLocalChatHistory(messages: SyncedChatMessage[]): void {
  if (typeof window === 'undefined') return;
  try {
    cachedMessages = messages;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
    window.dispatchEvent(new CustomEvent(SYNC_EVENT, { detail: messages }));
  } catch (e) {
    console.warn('Failed to save local AI chat history:', e);
  }
}

export async function fetchServerChatHistory(): Promise<SyncedChatMessage[]> {
  try {
    const res = await fetch('/api/ai/conversation', {
      headers: { 'Accept': 'application/json' },
      signal: AbortSignal.timeout(3000),
    });
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data.messages)) {
        // Merge server messages with local storage
        const local = getLocalChatHistory();
        const mergedMap = new Map<string, SyncedChatMessage>();
        
        // Add local first
        local.forEach((msg) => mergedMap.set(msg.id, msg));
        // Server overrides/adds
        data.messages.forEach((msg: SyncedChatMessage) => mergedMap.set(msg.id, msg));
        
        const merged = Array.from(mergedMap.values());
        saveLocalChatHistory(merged);
        return merged;
      }
    }
  } catch (e) {
    // Network fallback to local storage
  }
  return getLocalChatHistory();
}

export async function syncChatMessageToServer(message: SyncedChatMessage): Promise<void> {
  try {
    await fetch('/api/ai/conversation', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message }),
      signal: AbortSignal.timeout(3000),
    });
  } catch (e) {
    console.warn('Could not sync chat message to backend server:', e);
  }
}

export async function removeChatMessage(id: string): Promise<void> {
  const current = getLocalChatHistory();
  const filtered = current.filter((msg) => msg.id !== id);
  saveLocalChatHistory(filtered);
  try {
    await fetch(`/api/ai/conversation/${encodeURIComponent(id)}`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages: filtered }),
      signal: AbortSignal.timeout(3000),
    });
  } catch (e) {
    console.warn('Could not sync deleted message to backend server:', e);
  }
}

export async function clearSyncedChatHistory(): Promise<void> {
  saveLocalChatHistory([]);
  try {
    await fetch('/api/ai/conversation', {
      method: 'DELETE',
      signal: AbortSignal.timeout(3000),
    });
  } catch (e) {
    console.warn('Could not clear chat history on server:', e);
  }
}

export function subscribeToChatUpdates(callback: (messages: SyncedChatMessage[]) => void): () => void {
  if (typeof window === 'undefined') return () => {};

  const handleCustomEvent = (e: Event) => {
    const detail = (e as CustomEvent).detail;
    if (detail) {
      callback(detail);
    } else {
      callback(getLocalChatHistory());
    }
  };

  const handleStorageEvent = (e: StorageEvent) => {
    if (e.key === STORAGE_KEY && e.newValue) {
      try {
        const parsed = JSON.parse(e.newValue);
        callback(parsed);
      } catch {
        // ignore
      }
    }
  };

  window.addEventListener(SYNC_EVENT, handleCustomEvent);
  window.addEventListener('storage', handleStorageEvent);

  return () => {
    window.removeEventListener(SYNC_EVENT, handleCustomEvent);
    window.removeEventListener('storage', handleStorageEvent);
  };
}
