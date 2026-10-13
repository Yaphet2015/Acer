import { describe, expect, it } from 'vitest';
import { bumpRecent, createSkillStore, DEFAULT_SKILLS, orderByRecent, renderTemplate } from '../lib/skills';
import type { KV } from '../lib/cache';

const memKV = (): KV => { const m = new Map<string, unknown>(); return { get: async (k) => structuredClone(m.get(k)), set: async (k, v) => void m.set(k, structuredClone(v)), remove: async (k) => void m.delete(k) }; };
let n = 0; const gen = () => `s${++n}`;

describe('renderTemplate', () => {
  it('fills placeholders', () => {
    expect(renderTemplate('T={{page_title}} S={{selection}} I={{ input }}', { input: 'hi', selection: 'sel', page_title: 'Page' })).toBe('T=Page S=sel I=hi');
  });
  it('{{input}} falls back to the selection', () => {
    expect(renderTemplate('翻译：{{input}}', { input: '  ', selection: 'hello' })).toBe('翻译：hello');
  });
  it('appends input when the template has no {{input}} slot; trims empty placeholders', () => {
    expect(renderTemplate('提炼要点', { input: '重点看第二段' })).toBe('提炼要点\n\n重点看第二段');
    expect(renderTemplate('A\n\n{{selection}}\n\n\nB', {})).toBe('A\n\nB');
  });
});

describe('Skill store CRUD', () => {
  it('starts with built-in defaults', async () => {
    const s = createSkillStore(memKV(), gen);
    expect((await s.list()).map((x) => x.name)).toEqual(DEFAULT_SKILLS.map((x) => x.name));
    expect((await s.list()).map((x) => x.name)).toContain('翻译成英文');
  });
  it('add / update / move / remove, with validation', async () => {
    const s = createSkillStore(memKV(), gen);
    const a = await s.add({ name: ' 改写 ', icon: '✍️', template: '改写：{{input}}' });
    expect(a.name).toBe('改写');
    await expect(s.add({ name: '', template: 'x' })).rejects.toThrow(/名称/);
    await expect(s.add({ name: 'x', template: '  ' })).rejects.toThrow(/模板/);
    await s.update(a.id, { name: '改写得更正式', icon: '' });
    let all = await s.list();
    expect(all.at(-1)).toMatchObject({ id: a.id, name: '改写得更正式', icon: undefined });
    await expect(s.update('missing', { name: 'x' })).rejects.toThrow();
    await s.move(a.id, -1); all = await s.list();
    expect(all.at(-2)!.id).toBe(a.id);
    await s.move(all[0]!.id, -1); expect((await s.list())[0]!.id).toBe(all[0]!.id); // no-op at edge
    await s.markUsed(a.id); await s.remove(a.id);
    expect((await s.list()).some((x) => x.id === a.id)).toBe(false);
    expect(await s.recent()).not.toContain(a.id);
    await s.resetDefaults(); expect(await s.list()).toHaveLength(DEFAULT_SKILLS.length);
  });
});

describe('recent ordering', () => {
  it('bumpRecent moves to front, de-dupes, caps', () => {
    expect(bumpRecent(['a', 'b', 'c'], 'c')).toEqual(['c', 'a', 'b']);
    expect(bumpRecent(['a', 'b'], 'x', 2)).toEqual(['x', 'a']);
  });
  it('orderByRecent puts used skills first, rest in list order, drops unknown ids', async () => {
    const list = [{ id: 'a', name: 'A', template: 't' }, { id: 'b', name: 'B', template: 't' }, { id: 'c', name: 'C', template: 't' }];
    expect(orderByRecent(list, ['c', 'zzz', 'a']).map((x) => x.id)).toEqual(['c', 'a', 'b']);
    const s = createSkillStore(memKV(), gen);
    const ids = (await s.list()).map((x) => x.id);
    await s.markUsed(ids[2]!); await s.markUsed(ids[0]!);
    expect((await s.ordered()).map((x) => x.id).slice(0, 3)).toEqual([ids[0], ids[2], ids[1]]);
  });
});
