import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { Markdown } from '../components/Markdown';

const html = (text: string, streaming = false) => renderToStaticMarkup(<Markdown text={text} streaming={streaming} />);

describe('Markdown', () => {
  it('renders headings, bold, lists, code, tables', () => {
    const out = html('## Title\n\n**bold** and `code`\n\n- a\n- b\n\n```js\nconst x = 1;\n```\n\n| A | B |\n|---|---|\n| 1 | 2 |');
    for (const tag of ['<h2', 'data-streamdown="strong"', '<li', '<code', '<table', '<td']) expect(out).toContain(tag);
  });
  it('opens links in a new tab and drops images', () => {
    const out = html('[site](https://example.com) ![x](https://example.com/a.png)');
    expect(out).toMatch(/<a[^>]*href="https:\/\/example.com\/?"[^>]*target="_blank"/);
    expect(out).toContain('rel="noopener noreferrer"');
    expect(out).not.toContain('<img');
  });
  it('tolerates half-finished markdown while streaming', () => {
    const out = html('Some **bold text that has not clos', true);
    expect(out).toContain('data-streamdown="strong"');
    expect(out).not.toContain('**');
  });
});
