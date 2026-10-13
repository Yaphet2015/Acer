/** Picks the mock or the real (pi durable) provider from settings, so callers never branch on it. */
import { runTurn } from './llm';
import { mockStream, mockSummary, useMock } from './mock';
import { parseSummary } from './parse';
import { chatSystem, SUMMARY_INSTRUCTIONS, summaryInput } from './prompts';
import type { ChatMessage, Settings, Summary } from './types';

export interface Provider {
  summarize(title: string, url: string, content: string): Promise<Summary>;
  chat(ctx: { title: string; summary: Summary; content: string }, history: ChatMessage[], input: string, onDelta: (t: string) => void, signal?: AbortSignal): Promise<string>;
}

export function providerFor(s: Settings): Provider {
  if (useMock(s)) return { summarize: (title) => mockSummary(title), chat: (_c, _h, input, onDelta, signal) => mockStream(input, onDelta, signal) };
  return {
    summarize: async (title, url, content) => parseSummary(await runTurn(s, SUMMARY_INSTRUCTIONS, [], summaryInput(title, url, content))),
    chat: (c, history, input, onDelta, signal) => runTurn(s, chatSystem(c.title, c.summary, c.content), history, input, onDelta, signal),
  };
}
