import { createCache } from '@/lib/cache';
import { CHAT_PORT, TOGGLE, type Api, type ChatEvent, type ChatRequest, type MsgType, type Request } from '@/lib/messages';
import { listModels, testConnection } from '@/lib/models';
import { providerFor } from '@/lib/provider';
import { runChatTurn } from '@/lib/chat';
import { closeSession, forkSession, setActive } from '@/lib/sessions';
import { messages, resolveLang, uiLanguage } from '@/lib/i18n';
import { chromeKV, loadSettings } from '@/lib/storage';

const COMMAND = 'toggle-overlay';

export default defineBackground(() => {
  const cache = createCache(chromeKV);
  /** settings + resolved UI language */
  const ctx = async () => { const s = await loadSettings(); return { s, lang: resolveLang(s.lang, uiLanguage()) }; };

  // ── toggle: keyboard command + toolbar button ───────────────────────────
  const toggle = async (tabId?: number) => {
    if (tabId == null) return;
    try { await chrome.tabs.sendMessage(tabId, TOGGLE); } catch { /* no content script (chrome:// etc.) */ }
  };
  chrome.commands.onCommand.addListener(async (cmd, tab) => {
    if (cmd !== COMMAND) return;
    toggle(tab?.id ?? (await chrome.tabs.query({ active: true, currentWindow: true }))[0]?.id);
  });
  chrome.action.onClicked.addListener((tab) => toggle(tab.id));

  // ── request/response handlers (typed by lib/messages.ts) ────────────────
  type Handlers = { [K in MsgType]: (req: Api[K]['req']) => Promise<Api[K]['res']> };
  const handlers: Handlers = {
    getCached: async ({ url }) => ({ cached: await cache.getSummary(url) }),
    summarize: async ({ url, title, content, force }) => {
      if (!force) { const c = await cache.getSummary(url); if (c) return { summary: c.summary }; }
      const { s, lang } = await ctx();
      const summary = await providerFor(s, lang).summarize(title, url, content);
      await cache.clearSummary(url);
      await cache.setSummary(url, { summary, content, title });
      return { summary };
    },
    getShortcut: async () => ({ shortcut: (await chrome.commands.getAll()).find((c) => c.name === COMMAND)?.shortcut ?? '' }),
    listModels: async ({ settings }) => ({ models: await listModels(settings, fetch, undefined, (await ctx()).lang) }),
    testConnection: async ({ settings }) => ({ result: await testConnection(settings) }),
    getSessions: async ({ url }) => ({ state: await cache.getSessions(url) }),
    forkSession: async ({ url, from }) => {
      let id = '';
      const state = await cache.updateSessions(url, (s) => { const r = forkSession(s, from); id = r.id; return r.state; });
      return { state, id };
    },
    closeSession: async ({ url, id }) => ({ state: await cache.updateSessions(url, (s) => closeSession(s, id)) }),
    setActiveSession: async ({ url, id }) => ({ state: await cache.updateSessions(url, (s) => setActive(s, id)) }),
  };
  chrome.runtime.onMessage.addListener((msg: Request, _sender, reply) => {
    const handler = handlers[msg?.type] as ((req: unknown) => Promise<object>) | undefined;
    if (!handler) return false; // e.g. the content script's own TOGGLE
    handler(msg).then((r) => reply({ ok: true, ...r }), (e) => reply({ ok: false, error: String(e?.message ?? e) }));
    return true;
  });

  // ── streaming chat ──────────────────────────────────────────────────────
  chrome.runtime.onConnect.addListener((port) => {
    if (port.name !== CHAT_PORT) return;
    const ac = new AbortController();
    port.onDisconnect.addListener(() => ac.abort());
    const post = (e: ChatEvent) => { try { port.postMessage(e); } catch { /* port closed */ } };
    port.onMessage.addListener(async ({ url, text, sid, label }: ChatRequest) => {
      try {
        const { s, lang } = await ctx();
        await runChatTurn(cache, providerFor(s, lang), { url, text, sid, label }, (delta) => post({ delta }), ac.signal, messages(lang).summaryExpired);
        post({ done: true });
      } catch (e: any) {
        post({ error: String(e?.message ?? e) });
      }
    });
  });
});
