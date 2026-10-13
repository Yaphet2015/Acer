import type { ChatMessage, Summary } from './types';
import { initialState, MAIN_ID, type SessionsState } from './sessions';

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
    async clearSummary(url: string) { await kv.remove('sum:' + url); await kv.remove('chat:' + url); await kv.remove('sess:' + url); },
    /** Chat sessions for a page (main + side sessions). Migrates the legacy single-chat key. */
    async getSessions(url: string): Promise<SessionsState> {
      const s = (await kv.get('sess:' + url)) as SessionsState | undefined;
      if (s?.sessions?.length) return s;
      return initialState(((await kv.get('chat:' + url)) as ChatMessage[]) ?? [], now());
    },
    async setSessions(url: string, s: SessionsState) { await kv.set('sess:' + url, s); await kv.remove('chat:' + url); },
    async getChat(url: string, sid = MAIN_ID): Promise<ChatMessage[]> {
      return (await this.getSessions(url)).sessions.find((x) => x.id === sid)?.messages ?? [];
    },
    async setChat(url: string, msgs: ChatMessage[], sid = MAIN_ID) {
      const s = await this.getSessions(url);
      await this.setSessions(url, { ...s, sessions: s.sessions.map((x) => (x.id === sid ? { ...x, messages: msgs } : x)) });
    },
  };
}
