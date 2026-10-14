import type { Summary } from './types';
import { ICON_TYPES } from './types';

export const MAX_CONTENT_CHARS = 60000;

import { messages, type Lang } from './i18n';

/** Appends the user's own instructions after the built-in ones. The built-in rules (incl. the JSON contract) always stay. */
export function withUserPrompt(base: string, custom: string | undefined, note: string): string {
  const extra = (custom ?? '').trim();
  return extra ? `${base}\n\n${note}\n${extra}` : base;
}
const SUMMARY_NOTE = 'Additional instructions from the user. Apply them to tone, focus and wording only; the JSON format above is mandatory and overrides anything below:';
const CHAT_NOTE = 'Additional instructions from the user:';

export const summaryInstructions = (lang: Lang, custom?: string) => withUserPrompt(summaryBase(lang), custom, SUMMARY_NOTE);
const summaryBase = (lang: Lang) => `You summarize web pages. Reply with ONLY a JSON object, no prose:
{"overview": string (3-5 sentences), "keyTerms": string[] (3-8 terms that appear verbatim in overview), "sections": [{"title": string, "icon": one of ${JSON.stringify(ICON_TYPES)}, "bullets": string[] (2-5 concise points)}] (3-6 sections)}
Write all text in ${messages(lang).replyLanguage}, whatever the page language. Key terms must appear verbatim in the overview.`;

export function summaryInput(title: string, url: string, content: string) {
  return `Title: ${title}\nURL: ${url}\n\n${content.slice(0, MAX_CONTENT_CHARS)}`;
}

export const CHAT_RULES = "Answer concisely, in the user's language, using Markdown when helpful.";

export function chatSystem(title: string, summary: Summary, content: string, custom?: string) {
  return withUserPrompt(`You are a helpful assistant answering questions about the web page "${title}".
Summary (JSON): ${JSON.stringify(summary)}
Page content (Markdown):
${content.slice(0, MAX_CONTENT_CHARS)}
${CHAT_RULES}`, custom, CHAT_NOTE);
}
