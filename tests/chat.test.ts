import { describe, expect, it } from 'vitest';
import { createCache } from '../lib/cache';
import { runChatTurn } from '../lib/chat';
import type { Provider } from '../lib/provider';
import { memKV } from '../lib/storage';

const summary = { overview: 'o', keyTerms: [], sections: [] };

describe('runChatTurn', () => {
  it('saves the user message before the reply arrives, then the reply', async () => {
    const cache = createCache(memKV());
    await cache.setSummary('u', { summary, content: 'c', title: 't' });
    let release!: (v: string) => void;
    let historySeen: unknown;
    const provider: Provider = { summarize: async () => summary, chat: (_c, h) => { historySeen = h; return new Promise((r) => { release = r; }); } };
    const turn = runChatTurn(cache, provider, { url: 'u', text: 'first?', sid: 'main' }, () => {}, undefined, 'expired');
    await new Promise((r) => setTimeout(r, 0));
    // mid-stream: a fresh read (e.g. the panel re-mounting) already sees the first message
    expect((await cache.getSessions('u')).sessions[0]!.messages).toEqual([{ role: 'user', content: 'first?' }]);
    expect(historySeen).toEqual([]); // the new message is the input, not part of the history
    release('answer');
    await turn;
    expect((await cache.getSessions('u')).sessions[0]!.messages).toEqual([{ role: 'user', content: 'first?' }, { role: 'assistant', content: 'answer' }]);
  });
  it('fails without a cached summary and saves nothing', async () => {
    const cache = createCache(memKV());
    const provider: Provider = { summarize: async () => summary, chat: async () => 'x' };
    await expect(runChatTurn(cache, provider, { url: 'u', text: 'q', sid: 'main' }, () => {}, undefined, 'expired')).rejects.toThrow('expired');
    expect((await cache.getSessions('u')).sessions[0]!.messages).toEqual([]);
  });
});
