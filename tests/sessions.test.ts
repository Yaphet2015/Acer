import { describe, expect, it } from 'vitest';
import { appendMessages, closeSession, forkSession, initialState, MAIN_ID, parseSide, setActive } from '../lib/sessions';
import { createCache, type KV } from '../lib/cache';

const memKV = (): KV => { const m = new Map<string, unknown>(); return { get: async (k) => structuredClone(m.get(k)), set: async (k, v) => void m.set(k, structuredClone(v)), remove: async (k) => void m.delete(k) }; };

describe('parseSide', () => {
  it('parses /side with and without a message', () => {
    expect(parseSide('/side')).toEqual({ message: '' });
    expect(parseSide('  /side   换个角度说说 ')).toEqual({ message: '换个角度说说' });
    expect(parseSide('/SIDE hi\nthere')).toEqual({ message: 'hi\nthere' });
    expect(parseSide('/sidebar')).toBeNull();
    expect(parseSide('hello /side')).toBeNull();
  });
});

describe('forkSession', () => {
  const base = initialState([{ role: 'user', content: 'q1' }, { role: 'assistant', content: 'a1' }, { role: 'assistant', content: '' }], 1);
  it('copies history (dropping empty placeholders), names sequentially, activates the side', () => {
    const { state, id } = forkSession(base, MAIN_ID, 2, 'side-a');
    expect(state.active).toBe('side-a');
    const side = state.sessions.find((s) => s.id === id)!;
    expect(side.name).toBe('支线 1'); expect(side.parent).toBe(MAIN_ID);
    expect(side.messages).toEqual([{ role: 'user', content: 'q1' }, { role: 'assistant', content: 'a1' }]);
    const second = forkSession(state, 'side-a', 3, 'side-b');
    expect(second.state.sessions.map((s) => s.name)).toEqual(['主线', '支线 1', '支线 2']);
    expect(second.state.sessions[2]!.parent).toBe('side-a');
  });
  it('diverges after the fork (no shared references)', () => {
    const { state, id } = forkSession(base, MAIN_ID, 2, 'side-a');
    const s2 = appendMessages(state, id, [{ role: 'user', content: 'only in side' }]);
    expect(s2.sessions[0]!.messages).toHaveLength(3);
    expect(s2.sessions[1]!.messages.at(-1)!.content).toBe('only in side');
    s2.sessions[1]!.messages[0]!.content = 'mutated';
    expect(base.sessions[0]!.messages[0]!.content).toBe('q1');
  });
  it('close falls back to main; main cannot be closed; numbering continues after close', () => {
    const a = forkSession(base, MAIN_ID, 2, 'a').state;
    const b = forkSession(a, MAIN_ID, 3, 'b').state;
    const closed = closeSession(b, 'b');
    expect(closed.active).toBe(MAIN_ID); expect(closed.sessions.map((s) => s.id)).toEqual([MAIN_ID, 'a']);
    expect(closeSession(closed, MAIN_ID)).toBe(closed);
    expect(setActive(closed, 'a').active).toBe('a');
    expect(setActive(closed, 'nope').active).toBe(MAIN_ID);
    expect(forkSession(closed, MAIN_ID, 4, 'c').state.sessions.at(-1)!.name).toBe('支线 2');
  });
  it('persists per page and migrates the legacy chat key; re-summarize clears sessions', async () => {
    const kv = memKV(); const c = createCache(kv);
    await kv.set('chat:u', [{ role: 'user', content: 'legacy' }]);
    const s = await c.getSessions('u');
    expect(s.sessions[0]!.messages[0]!.content).toBe('legacy');
    const { state } = forkSession(s, MAIN_ID, 5, 'x');
    await c.setSessions('u', state);
    expect((await c.getSessions('u')).sessions.map((x) => x.id)).toEqual([MAIN_ID, 'x']);
    expect((await c.getSessions('other')).sessions).toHaveLength(1);
    await c.clearSummary('u');
    expect((await c.getSessions('u')).sessions).toHaveLength(1);
  });
});
