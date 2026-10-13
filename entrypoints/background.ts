import { chromeKV, createCache } from '@/lib/cache';
import { runTurn } from '@/lib/llm';
import { mockStream, mockSummary, useMock } from '@/lib/mock';
import { parseSummary } from '@/lib/parse';
import { chatSystem, SUMMARY_INSTRUCTIONS, summaryInput } from '@/lib/prompts';
import { getSettings } from '@/lib/settings';
import type { ChatMessage } from '@/lib/types';

export default defineBackground(() => {
  const cache = createCache(chromeKV());

  const toggle = async (tabId?: number) => {
    if (tabId == null) return;
    try { await chrome.tabs.sendMessage(tabId, { type: 'toggle' }); } catch { /* no content script (chrome:// etc.) */ }
  };
  chrome.commands.onCommand.addListener(async (cmd, tab) => {
    if (cmd !== 'toggle-overlay') return;
    toggle(tab?.id ?? (await chrome.tabs.query({ active: true, currentWindow: true }))[0]?.id);
  });
  chrome.action.onClicked.addListener((tab) => toggle(tab.id));

  chrome.runtime.onMessage.addListener((msg, _sender, reply) => {
    (async () => {
      if (msg.type === 'getCached') {
        const c = await cache.getSummary(msg.url);
        return { cached: c, chat: c ? await cache.getChat(msg.url) : [] };
      }
      if (msg.type === 'summarize') {
        const { url, title, content, force } = msg;
        if (!force) { const c = await cache.getSummary(url); if (c) return { summary: c.summary, chat: await cache.getChat(url) }; }
        const s = await getSettings();
        const summary = useMock(s)
          ? await mockSummary(title)
          : parseSummary(await runTurn(s, SUMMARY_INSTRUCTIONS, [], summaryInput(title, url, content)));
        await cache.clearSummary(url);
        await cache.setSummary(url, { summary, content, title });
        return { summary, chat: [] };
      }
      if (msg.type === 'openOptions') { chrome.runtime.openOptionsPage(); return {}; }
      if (msg.type === 'clearChat') { await cache.setChat(msg.url, []); return {}; }
    })().then((r) => reply({ ok: true, ...r }), (e) => reply({ ok: false, error: String(e?.message ?? e) }));
    return true;
  });

  chrome.runtime.onConnect.addListener((port) => {
    if (port.name !== 'chat') return;
    const ac = new AbortController();
    port.onDisconnect.addListener(() => ac.abort());
    port.onMessage.addListener(async ({ url, text }: { url: string; text: string }) => {
      try {
        const c = await cache.getSummary(url);
        if (!c) throw new Error('总结已过期，请点击「重新总结」。');
        const prior: ChatMessage[] = await cache.getChat(url);
        const s = await getSettings();
        const onDelta = (d: string) => port.postMessage({ delta: d });
        const out = useMock(s)
          ? await mockStream(text, onDelta, ac.signal)
          : await runTurn(s, chatSystem(c.title, c.summary, c.content), prior, text, onDelta, ac.signal);
        await cache.setChat(url, [...prior, { role: 'user', content: text }, { role: 'assistant', content: out }]);
        port.postMessage({ done: true });
      } catch (e: any) {
        try { port.postMessage({ error: String(e?.message ?? e) }); } catch {}
      }
    });
  });
});
