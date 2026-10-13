/** All chrome.storage.local access goes through a tiny KV interface so logic stays testable. */
import { DEFAULT_SETTINGS, type Settings } from './types';

export interface KV {
  get(key: string): Promise<unknown>;
  set(key: string, value: unknown): Promise<void>;
  remove(key: string): Promise<void>;
}

export const chromeKV: KV = {
  async get(k) { return (await chrome.storage.local.get(k))[k]; },
  async set(k, v) { await chrome.storage.local.set({ [k]: v }); },
  async remove(k) { await chrome.storage.local.remove(k); },
};

/** In-memory KV (tests). Values are cloned like chrome.storage does. */
export function memKV(): KV {
  const m = new Map<string, unknown>();
  return { get: async (k) => structuredClone(m.get(k)), set: async (k, v) => void m.set(k, structuredClone(v)), remove: async (k) => void m.delete(k) };
}

/** Storage keys (single source of truth). */
export const KEYS = { settings: 'settings', panelWidth: 'panelWidth', skills: 'skills', skillsRecent: 'skillsRecent' } as const;

export async function loadSettings(kv: KV = chromeKV): Promise<Settings> {
  return { ...DEFAULT_SETTINGS, ...((await kv.get(KEYS.settings)) as Partial<Settings> | undefined) };
}
export const saveSettings = (s: Settings, kv: KV = chromeKV) => kv.set(KEYS.settings, s);

/** Subscribe to chrome.storage changes of the given keys; returns an unsubscribe function. */
export function onStorageChange(keys: string[], fn: () => void): () => void {
  const h = (c: Record<string, unknown>, area: string) => { if (area === 'local' && keys.some((k) => k in c)) fn(); };
  chrome.storage.onChanged.addListener(h);
  return () => chrome.storage.onChanged.removeListener(h);
}
