import type { ChatMessage, Summary } from './types';

export const TTL_MS = 24 * 60 * 60 * 1000;

export interface KV {
  get(key: string): Promise<unknown>;
  set(key: string, value: unknown): Promise<void>;
  remove(key: string): Promise<void>;
}

export interface CachedSummary { summary: Summary; content: string; title: string; createdAt: number }

export function isFresh(createdAt: number, now = Date.now(), ttl = TTL_MS): boolean {
  return now - createdAt >= 0 && now - createdAt < ttl;
}

export function chromeKV(): KV {
  return {
    async get(k) { return (await chrome.storage.local.get(k))[k]; },
    async set(k, v) { await chrome.storage.local.set({ [k]: v }); },
    async remove(k) { await chrome.storage.local.remove(k); },
  };
}

export function createCache(kv: KV, now: () => number = Date.now) {
  return {
    async getSummary(url: string): Promise<CachedSummary | null> {
      const v = (await kv.get('sum:' + url)) as CachedSummary | undefined;
      if (!v) return null;
      if (!isFresh(v.createdAt, now())) { await kv.remove('sum:' + url); return null; }
      return v;
    },
    async setSummary(url: string, data: Omit<CachedSummary, 'createdAt'>) {
      await kv.set('sum:' + url, { ...data, createdAt: now() });
    },
    async clearSummary(url: string) { await kv.remove('sum:' + url); await kv.remove('chat:' + url); },
    async getChat(url: string): Promise<ChatMessage[]> { return ((await kv.get('chat:' + url)) as ChatMessage[]) ?? []; },
    async setChat(url: string, msgs: ChatMessage[]) { await kv.set('chat:' + url, msgs); },
  };
}
