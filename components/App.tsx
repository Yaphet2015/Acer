import { AnimatePresence, motion } from 'framer-motion';
import { useCallback, useEffect, useState } from 'react';
import { extractPage } from '@/lib/extract';
import { normalizeUrl } from '@/lib/url';
import type { ChatMessage, Summary } from '@/lib/types';
import { bus } from './bus';
import { Chat } from './Chat';
import { Close, Logo, Minus, Refresh } from './Icons';
import { Overview } from './Overview';
import { Segmented, type Tab } from './Segmented';
import { Skeleton } from './Skeleton';

const send = (msg: any) => chrome.runtime.sendMessage(msg) as Promise<any>;

export function App() {
  const [open, setOpen] = useState(true);
  const [min, setMin] = useState(false);
  const [tab, setTab] = useState<Tab>('overview');
  const [url, setUrl] = useState(() => normalizeUrl(location.href));
  const [title, setTitle] = useState(document.title);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [chat, setChat] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const run = useCallback(async (force: boolean) => {
    const u = normalizeUrl(location.href);
    setUrl(u); setLoading(true); setError('');
    if (force) { setSummary(null); setChat([]); }
    try {
      if (!force) {
        const c = await send({ type: 'getCached', url: u });
        if (c.ok && c.cached) { setSummary(c.cached.summary); setTitle(c.cached.title); setChat(c.chat); return; }
      }
      const page = extractPage();
      setTitle(page.title);
      const r = await send({ type: 'summarize', url: u, title: page.title, content: page.content, force });
      if (!r.ok) throw new Error(r.error);
      setSummary(r.summary); setChat(r.chat);
    } catch (e: any) {
      setError(String(e.message ?? e));
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { run(false); }, [run]);
  useEffect(() => bus.on('toggle', () => setOpen((o) => {
    if (!o && normalizeUrl(location.href) !== url) run(false); // SPA navigation
    return !o;
  })), [url, run]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 16 }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
          className="fixed right-5 top-5 flex w-[380px] flex-col overflow-hidden bg-white font-sans text-zinc-900 antialiased"
          style={{ borderRadius: 14, boxShadow: '0 8px 24px rgba(0,0,0,.1)', height: min ? 'auto' : 'calc(100vh - 40px)', border: '1px solid rgba(0,0,0,.06)' }}
        >
          <header className="flex h-12 shrink-0 items-center justify-between px-4">
            <div className="flex items-center gap-2"><Logo /><span className="text-[14px] font-semibold">Open Mind</span></div>
            <div className="flex items-center gap-1 text-zinc-500">
              <button title="Minimize" onClick={() => setMin((m) => !m)} className="rounded-md p-1.5 hover:bg-zinc-100"><Minus /></button>
              <button title="Close" onClick={() => setOpen(false)} className="rounded-md p-1.5 hover:bg-zinc-100"><Close /></button>
            </div>
          </header>
          {!min && (
            <>
              <div className="flex shrink-0 items-center gap-2 border-y border-zinc-100 px-4 py-2.5">
                <span className="min-w-0 flex-1 truncate text-[13px] font-medium text-zinc-700" title={title}>{title}</span>
                <button onClick={() => run(true)} disabled={loading}
                  className="flex shrink-0 items-center gap-1 rounded-full border border-zinc-200 px-2.5 py-1 text-[12px] text-zinc-700 hover:bg-zinc-50 disabled:opacity-40">
                  <Refresh className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} /> Re-summarize
                </button>
              </div>
              <div className="relative min-h-0 flex-1">
                {tab === 'overview' ? (
                  <div className="om-scroll h-full overflow-y-auto">
                    {loading && <Skeleton />}
                    {!loading && error && <ErrorView error={error} retry={() => run(true)} />}
                    {!loading && summary && (
                      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.2 }}>
                        <Overview summary={summary} />
                      </motion.div>
                    )}
                  </div>
                ) : (
                  <Chat url={url} messages={chat} setMessages={setChat} disabled={!summary || loading} />
                )}
              </div>
              <div className="shrink-0 py-3"><Segmented value={tab} onChange={setTab} /></div>
            </>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function ErrorView({ error, retry }: { error: string; retry: () => void }) {
  const noKey = error.includes('NO_KEY');
  return (
    <div className="space-y-3 p-6 text-center text-[13px] text-zinc-600">
      <p>{noKey ? 'Please set your API key in the options page first.' : error}</p>
      <div className="flex justify-center gap-2">
        {noKey
          ? <button onClick={() => send({ type: 'openOptions' })} className="rounded-full bg-zinc-900 px-3 py-1.5 text-white">Open settings</button>
          : <button onClick={retry} className="rounded-full border border-zinc-200 px-3 py-1.5">Retry</button>}
      </div>
    </div>
  );
}
