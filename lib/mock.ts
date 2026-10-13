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

export function buildMockSummary(title: string): Summary {
  const t = title.trim() || '这个页面';
  return {
    overview: `这是「${t}」的模拟总结。文章先提出一个核心观点，再用具体例子解释背后的机制，最后给出可以落地的实践建议。开启 Mock 模式后，不需要真实模型和 API Key 也能完整预览 Open Mind 的界面流程。`,
    keyTerms: ['模拟总结', '核心观点', '实践建议', 'Mock 模式'],
    sections: [
      { title: '核心观点', icon: 'target', bullets: ['点明页面要解决的主要问题', '说明这个问题为什么重要', '为后文的论证做铺垫'] },
      { title: '工作原理', icon: 'lightbulb', bullets: ['把机制拆成几个清晰的步骤', '每一步都配一个例子', '指出取舍和边界情况'] },
      { title: '要点回顾', icon: 'check', bullets: ['集中列出关键结论', '建议下一步可以尝试什么', '给出延伸阅读方向'] },
    ],
  };
}

export async function mockSummary(title: string, signal?: AbortSignal): Promise<Summary> {
  await sleep(MOCK_DELAY_MS, signal);
  return buildMockSummary(title);
}

export function mockReplyText(question: string): string {
  return `（模拟回复）你问的是：「${question.slice(0, 120)}」。\n\n根据总结，这个页面先提出核心观点，再一步步解释原理，最后在「要点回顾」里列出了下一步可以做什么。在设置页关闭 Mock 模式并填写 API Key，就能得到真实回答。`;
}

/** Stream the mock reply token by token (~30ms each): words for Latin text, 1–2 chars for CJK. */
export async function mockStream(question: string, onDelta: (t: string) => void, signal?: AbortSignal, tokenMs = 30): Promise<string> {
  const text = mockReplyText(question);
  for (const tok of text.match(/[\u3000-\u9fff\uff00-\uffef]{1,2}|[^\s\u3000-\u9fff\uff00-\uffef]+\s*|\s+/g) ?? []) { await sleep(tokenMs, signal); onDelta(tok); }
  return text;
}
