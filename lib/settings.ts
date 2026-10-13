import { DEFAULT_SETTINGS, type Settings } from './types';
export async function getSettings(): Promise<Settings> {
  const { settings } = await chrome.storage.local.get('settings');
  return { ...DEFAULT_SETTINGS, ...(settings ?? {}) };
}
export async function saveSettings(s: Settings) { await chrome.storage.local.set({ settings: s }); }
