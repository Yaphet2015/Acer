import { describe, expect, it, vi } from 'vitest';
import { buildMockSummary, MOCK_DELAY_MS, mockReplyText, mockStream, mockSummary, useMock } from '../lib/mock';
import { SummarySchema } from '../lib/parse';

const base = { baseUrl: 'https://api.openai.com/v1', apiKey: 'sk', model: 'm', mock: false };

describe('mock provider', () => {
  it('is used when toggled on or when no API key (except local servers)', () => {
    expect(useMock(base)).toBe(false);
    expect(useMock({ ...base, mock: true })).toBe(true);
    expect(useMock({ ...base, apiKey: '' })).toBe(true);
    expect(useMock({ ...base, apiKey: '', baseUrl: 'http://localhost:11434/v1' })).toBe(false);
  });
  it('returns a schema-valid summary with 3 sections after ~1.2s', async () => {
    vi.useFakeTimers();
    let done = false;
    const p = mockSummary('Title').then((s) => { done = true; return s; });
    await vi.advanceTimersByTimeAsync(MOCK_DELAY_MS - 50); expect(done).toBe(false);
    await vi.advanceTimersByTimeAsync(100);
    const s = await p; vi.useRealTimers();
    expect(SummarySchema.parse(s).sections).toHaveLength(3);
    for (const t of s.keyTerms) expect(s.overview).toContain(t);
    expect(buildMockSummary('X').sections.every((x) => x.bullets.length >= 2)).toBe(true);
  });
  it('streams the reply token by token', async () => {
    const parts: string[] = [];
    const out = await mockStream('hi', (d) => parts.push(d), undefined, 0);
    expect(parts.length).toBeGreaterThan(10);
    expect(parts.join('')).toBe(out);
    expect(out).toBe(mockReplyText('hi'));
  });
});
