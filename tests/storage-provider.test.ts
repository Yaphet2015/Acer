import { describe, expect, it } from 'vitest';
import { createCache } from '../lib/cache';
import { providerFor } from '../lib/provider';
import { forkSession } from '../lib/sessions';
import { KEYS, loadSettings, memKV, saveSettings } from '../lib/storage';
import { DEFAULT_SETTINGS } from '../lib/types';

describe('storage', () => {
  it('loadSettings merges stored values over defaults', async () => {
    const kv = memKV();
    expect(await loadSettings(kv)).toEqual(DEFAULT_SETTINGS);
    await kv.set(KEYS.settings, { apiKey: 'k' });
    expect(await loadSettings(kv)).toEqual({ ...DEFAULT_SETTINGS, apiKey: 'k' });
    await saveSettings({ ...DEFAULT_SETTINGS, model: 'm' }, kv);
    expect((await loadSettings(kv)).model).toBe('m');
  });
  it('cache.updateSessions persists the transformed state', async () => {
    const c = createCache(memKV());
    let id = '';
    const s = await c.updateSessions('u', (st) => { const r = forkSession(st, 'main'); id = r.id; return r.state; });
    expect(s.active).toBe(id);
    expect((await c.getSessions('u')).sessions).toHaveLength(2);
  });
});

describe('providerFor', () => {
  it('uses the mock provider when mock is on or there is no key', async () => {
    for (const s of [{ ...DEFAULT_SETTINGS, mock: true, apiKey: 'k' }, { ...DEFAULT_SETTINGS, apiKey: '' }]) {
      const out = await providerFor(s).chat({ title: 't', summary: { overview: 'o', keyTerms: [], sections: [] }, content: '' }, [], 'hi', () => {});
      expect(out.length).toBeGreaterThan(0);
    }
  }, 30000);
});
