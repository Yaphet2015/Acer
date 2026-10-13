import type { Settings, Summary } from './types';

export const MOCK_DELAY_MS = 1200;

/** Mock mode is used when toggled on, or when no API key is set (local servers like Ollama excepted). */
export function useMock(s: Settings): boolean {
  if (s.mock) return true;
  return !s.apiKey && !/^https?:\/\/(localhost|127\.0\.0\.1|\[::1\])(:|\/|$)/.test(s.baseUrl);
}

const sleep = (ms: number, signal?: AbortSignal) => new Promise<void>((res, rej) => {
  const t = setTimeout(res, ms);
  signal?.addEventListener('abort', () => { clearTimeout(t); rej(new Error('aborted')); });
});

export function buildMockSummary(title: string): Summary {
  const t = title.trim() || 'this page';
  return {
    overview: `This is a mock summary of “${t}”. The article introduces a core idea, explains the mechanism behind it with concrete examples, and closes with practical takeaways. Mock mode lets you preview the full Open Mind UI flow without a real language model or API key.`,
    keyTerms: ['mock summary', 'core idea', 'practical takeaways', 'Mock mode'],
    sections: [
      { title: 'Core idea', icon: 'target', bullets: ['States the main problem the page addresses', 'Frames why it matters for the reader', 'Sets up the argument for the rest of the piece'] },
      { title: 'How it works', icon: 'lightbulb', bullets: ['Breaks the mechanism into a few clear steps', 'Illustrates each step with an example', 'Notes trade-offs and edge cases'] },
      { title: 'Takeaways', icon: 'check', bullets: ['Summarizes the key lessons in one place', 'Suggests what to try next', 'Points to further reading'] },
    ],
  };
}

export async function mockSummary(title: string, signal?: AbortSignal): Promise<Summary> {
  await sleep(MOCK_DELAY_MS, signal);
  return buildMockSummary(title);
}

export function mockReplyText(question: string): string {
  return `(Mock reply) You asked: “${question.slice(0, 120)}”.\n\nBased on the summary, the page's core idea is explained step by step, and the takeaways section lists what to do next. Turn off Mock mode and add an API key in the options page to get real answers.`;
}

/** Stream the mock reply word by word (~30ms per token). */
export async function mockStream(question: string, onDelta: (t: string) => void, signal?: AbortSignal, tokenMs = 30): Promise<string> {
  const text = mockReplyText(question);
  for (const tok of text.match(/\S+\s*|\s+/g) ?? []) { await sleep(tokenMs, signal); onDelta(tok); }
  return text;
}
