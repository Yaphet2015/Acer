import { messages, type Lang } from './i18n';
import type { Settings, Summary } from './types';
import { isLocalUrl } from './url';

export const MOCK_DELAY_MS = 1200;

/** Mock mode is used when toggled on, or when no API key is set (local servers like Ollama excepted). */
export function useMock(s: Settings): boolean {
  if (s.mock) return true;
  return !s.apiKey && !isLocalUrl(s.baseUrl);
}

const sleep = (ms: number, signal?: AbortSignal) => new Promise<void>((res, rej) => {
  const t = setTimeout(res, ms);
  signal?.addEventListener('abort', () => { clearTimeout(t); rej(new Error('aborted')); });
});

export function buildMockSummary(title: string, lang: Lang = 'zh-CN'): Summary {
  const m = messages(lang);
  const icons = ['target', 'lightbulb', 'check'] as const;
  return {
    overview: m.mockOverview(title.trim() || m.mockPage),
    keyTerms: [...m.mockTerms],
    sections: m.mockSections.map(([title, bullets], i) => ({ title, icon: icons[i]!, bullets: [...bullets] })),
  };
}

export async function mockSummary(title: string, lang: Lang = 'zh-CN', signal?: AbortSignal): Promise<Summary> {
  await sleep(MOCK_DELAY_MS, signal);
  return buildMockSummary(title, lang);
}

export function mockReplyText(question: string, lang: Lang = 'zh-CN'): string {
  return messages(lang).mockReply(question.slice(0, 120));
}

/** Stream the mock reply token by token (~30ms each): words for Latin text, 1–2 chars for CJK. */
export async function mockStream(question: string, onDelta: (t: string) => void, signal?: AbortSignal, tokenMs = 30, lang: Lang = 'zh-CN'): Promise<string> {
  const text = mockReplyText(question, lang);
  for (const tok of text.match(/[\u3000-\u9fff\uff00-\uffef]{1,2}|[^\s\u3000-\u9fff\uff00-\uffef]+\s*|\s+/g) ?? []) { await sleep(tokenMs, signal); onDelta(tok); }
  return text;
}
