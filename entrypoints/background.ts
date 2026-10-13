import { chromeKV, createCache } from '@/lib/cache';
import { runTurn } from '@/lib/llm';
import { listModels, testConnection } from '@/lib/models';
import { mockStream, mockSummary, useMock } from '@/lib/mock';
import { parseSummary } from '@/lib/parse';
import { chatSystem, SUMMARY_INSTRUCTIONS, summaryInput } from '@/lib/prompts';
import { getSettings } from '@/lib/settings';
import type { ChatMessage } from '@/lib/types';
import { appendMessages, closeSession, forkSession, MAIN_ID, setActive } from '@/lib/sessions';

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
      if (msg.type === 'getShortcut') return { shortcut: (await chrome.commands.getAll()).find((c) => c.name === 'toggle-overlay')?.shortcut ?? '' };
      if (msg.type === 'listModels') return { models: await listModels(msg.settings) };
      if (msg.type === 'testConnection') return { result: await testConnection(msg.settings) };
      if (msg.type === 'openOptions') { chrome.runtime.openOptionsPage(); return {}; }
      if (msg.type === 'getSessions') return { state: await cache.getSessions(msg.url) };
      if (msg.type === 'forkSession') {
        const { state, id } = forkSession(await cache.getSessions(msg.url), msg.from);
        await cache.setSessions(msg.url, state); return { state, id };
      }
      if (msg.type === 'closeSession') { const state = closeSession(await cache.getSessions(msg.url), msg.id); await cache.setSessions(msg.url, state); return { state }; }
      if (msg.type === 'setActiveSession') { const state = setActive(await cache.getSessions(msg.url), msg.id); await cache.setSessions(msg.url, state); return { state }; }
      if (msg.type === 'clearChat') { await cache.setChat(msg.url, []); return {}; }
    })().then((r) => reply({ ok: true, ...r }), (e) => reply({ ok: false, error: String(e?.message ?? e) }));
    return true;
  });

  chrome.runtime.onConnect.addListener((port) => {
    if (port.name !== 'chat') return;
    const ac = new AbortController();
    port.onDisconnect.addListener(() => ac.abort());
    port.onMessage.addListener(async ({ url, text, sid = MAIN_ID, label }: { url: string; text: string; sid?: string; label?: string }) => {
      try {
        const c = await cache.getSummary(url);
        if (!c) throw new Error('总结已过期，请点击「重新总结」。');
        const prior: ChatMessage[] = (await cache.getChat(url, sid)).filter((m) => m.content);
        const s = await getSettings();
        const onDelta = (d: string) => port.postMessage({ delta: d });
        const out = useMock(s)
          ? await mockStream(text, onDelta, ac.signal)
          : await runTurn(s, chatSystem(c.title, c.summary, c.content), prior, text, onDelta, ac.signal);
        const userMsg: ChatMessage = label ? { role: 'user', content: text, label } : { role: 'user', content: text };
        await cache.setSessions(url, appendMessages(await cache.getSessions(url), sid, [userMsg, { role: 'assistant', content: out }]));
        port.postMessage({ done: true });
      } catch (e: any) {
        try { port.postMessage({ error: String(e?.message ?? e) }); } catch {}
      }
    });
  });
});
