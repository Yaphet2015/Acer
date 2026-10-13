import type { Summary } from './types';
import { ICON_TYPES } from './types';

export const MAX_CONTENT_CHARS = 60000;

export function summaryMessages(title: string, url: string, content: string) {
  return [
    {
      role: 'system',
      content: `You summarize web pages. Reply with ONLY a JSON object, no prose:
{"overview": string (3-5 sentences), "keyTerms": string[] (3-8 terms that appear verbatim in overview), "sections": [{"title": string, "icon": one of ${JSON.stringify(ICON_TYPES)}, "bullets": string[] (2-5 concise points)}] (3-6 sections)}
Write in the same language as the page.`,
    },
    { role: 'user', content: `Title: ${title}\nURL: ${url}\n\n${content.slice(0, MAX_CONTENT_CHARS)}` },
  ];
}

export function chatSystem(title: string, summary: Summary, content: string) {
  return `You are a helpful assistant answering questions about the web page "${title}".
Summary (JSON): ${JSON.stringify(summary)}
Page content (Markdown):
${content.slice(0, MAX_CONTENT_CHARS)}
Answer concisely, in the user's language, using Markdown when helpful.`;
}
