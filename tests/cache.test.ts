import { describe, expect, it } from 'vitest';
import { createCache, isFresh, TTL_MS, type KV } from '../lib/cache';
import { normalizeUrl } from '../lib/url';

const memKV = (): KV => { const m = new Map<string, unknown>(); return { get: async (k) => m.get(k), set: async (k, v) => void m.set(k, v), remove: async (k) => void m.delete(k) }; };
const summary = { overview: 'x', keyTerms: [], sections: [] };

describe('cache TTL', () => {
  it('isFresh boundaries', () => {
    expect(isFresh(0, TTL_MS - 1)).toBe(true);
    expect(isFresh(0, TTL_MS)).toBe(false);
    expect(isFresh(1000, 0)).toBe(false);
  });
  it('returns cached within 24h and expires after', async () => {
    let now = 1_000_000;
    const c = createCache(memKV(), () => now);
    await c.setSummary('u', { summary, content: 'c', title: 't' });
    now += TTL_MS - 1000;
    expect((await c.getSummary('u'))?.summary).toEqual(summary);
    now += 2000;
    expect(await c.getSummary('u')).toBeNull();
  });
  it('clearSummary also clears chat (re-summarize)', async () => {
    const c = createCache(memKV());
    await c.setSummary('u', { summary, content: 'c', title: 't' });
    await c.setChat('u', [{ role: 'user', content: 'hi' }]);
    await c.clearSummary('u');
    expect(await c.getSummary('u')).toBeNull();
    expect(await c.getChat('u')).toEqual([]);
  });
  it('normalizes URLs for cache keys', () => {
    expect(normalizeUrl('https://www.Example.com/a/?utm_source=x&b=2&a=1#top')).toBe('https://example.com/a/?a=1&b=2');
    expect(normalizeUrl('https://example.com/a/')).toBe('https://example.com/a');
  });
});
