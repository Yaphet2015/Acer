import Defuddle from 'defuddle/full';

export function extractPage(): { title: string; content: string } {
  const doc = document.cloneNode(true) as Document;
  try {
    const r = new Defuddle(doc, { markdown: true, url: location.href } as any).parse();
    const content = (r.contentMarkdown || r.content || '').trim();
    if (content) return { title: r.title || document.title, content };
  } catch (e) { console.warn('[open-mind] defuddle failed', e); }
  return { title: document.title, content: document.body.innerText.slice(0, 60000) };
}
