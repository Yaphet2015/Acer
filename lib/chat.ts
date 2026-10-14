import type { createCache } from './cache';
import type { Provider } from './provider';
import { appendMessages } from './sessions';
import type { ChatMessage } from './types';

type Cache = ReturnType<typeof createCache>;

/**
 * One chat turn for a page session. The user message is saved before the model is called, so it
 * survives the panel being re-rendered (tab switch, minimize, close) while the reply is streaming;
 * the reply is saved when it completes.
 */
export async function runChatTurn(
  cache: Cache, provider: Provider, req: { url: string; text: string; sid: string; label?: string },
  onDelta: (d: string) => void, signal: AbortSignal | undefined, expiredMsg: string,
): Promise<string> {
  const { url, text, sid, label } = req;
  const c = await cache.getSummary(url);
  if (!c) throw new Error(expiredMsg);
  const history = ((await cache.getSessions(url)).sessions.find((x) => x.id === sid)?.messages ?? []).filter((m) => m.content);
  const userMsg: ChatMessage = label ? { role: 'user', content: text, label } : { role: 'user', content: text };
  await cache.updateSessions(url, (s) => appendMessages(s, sid, [userMsg]));
  const out = await provider.chat(c, history, text, onDelta, signal);
  await cache.updateSessions(url, (s) => appendMessages(s, sid, [{ role: 'assistant', content: out }]));
  return out;
}
