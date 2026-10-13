import { describe, expect, it } from 'vitest';
import { highlightTerms, parseSummary } from '../lib/parse';

describe('parseSummary', () => {
  const obj = { overview: 'React uses a virtual DOM.', keyTerms: ['virtual DOM'], sections: [{ title: 'Core', icon: 'target', bullets: ['a', 'b'] }] };
  it('parses plain JSON', () => expect(parseSummary(JSON.stringify(obj))).toEqual(obj));
  it('parses fenced JSON with surrounding prose', () => {
    expect(parseSummary('Sure!\n```json\n' + JSON.stringify(obj) + '\n```')).toEqual(obj);
  });
  it('defaults unknown icons and tolerates key_terms / missing fields', () => {
    const r = parseSummary(JSON.stringify({ overview: 'x', key_terms: ['x', 3], sections: [{ title: 'S', icon: 'rocket' }, { nope: 1 }] }));
    expect(r).toEqual({ overview: 'x', keyTerms: ['x'], sections: [{ title: 'S', icon: 'list', bullets: [] }] });
  });
  it('rejects a section with an empty title (as the old zod schema did)', () => {
    expect(() => parseSummary(JSON.stringify({ overview: 'x', sections: [{ title: '  ', icon: 'list' }] }))).toThrow(/title/);
  });
  it('throws on invalid output', () => {
    expect(() => parseSummary('no json here')).toThrow();
    expect(() => parseSummary('{"sections":[]}')).toThrow(/overview/);
  });
});

describe('highlightTerms', () => {
  it('marks terms case-insensitively', () => {
    expect(highlightTerms('A Virtual DOM diff', ['virtual dom'])).toEqual([
      { text: 'A ', highlight: false }, { text: 'Virtual DOM', highlight: true }, { text: ' diff', highlight: false },
    ]);
  });
});
