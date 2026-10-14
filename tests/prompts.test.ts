import { describe, expect, it } from 'vitest';
import { chatSystem, summaryInstructions, withUserPrompt } from '../lib/prompts';

const summary = { overview: 'o', keyTerms: [], sections: [] };

describe('custom system prompt', () => {
  it('empty or blank custom text leaves the built-in prompt unchanged', () => {
    expect(summaryInstructions('en', '')).toBe(summaryInstructions('en'));
    expect(summaryInstructions('en', '   ')).toBe(summaryInstructions('en'));
    expect(chatSystem('T', summary, 'c', undefined)).toBe(chatSystem('T', summary, 'c'));
  });
  it('appends custom text after the built-in summary rules, keeping the JSON contract first', () => {
    const p = summaryInstructions('en', 'Always answer in a pirate tone');
    const base = summaryInstructions('en');
    expect(p.startsWith(base)).toBe(true);
    expect(p).toContain('Reply with ONLY a JSON object');
    expect(p).toMatch(/JSON format above is mandatory/);
    expect(p.trimEnd().endsWith('Always answer in a pirate tone')).toBe(true);
  });
  it('appends custom text to the chat system prompt', () => {
    const p = chatSystem('T', summary, 'page', '  Be brief.  ');
    expect(p.startsWith(chatSystem('T', summary, 'page'))).toBe(true);
    expect(p.endsWith('Be brief.')).toBe(true);
  });
  it('withUserPrompt joins with the note', () => {
    expect(withUserPrompt('A', 'B', 'N:')).toBe('A\n\nN:\nB');
  });
});
