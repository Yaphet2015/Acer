import { AnimatePresence, motion } from 'framer-motion';
import { useCallback, useEffect, useState } from 'react';
import { extractPage } from '@/lib/extract';
import { normalizeUrl } from '@/lib/url';
import type { ChatMessage, Summary } from '@/lib/types';
import { bus } from './bus';
import { Chat } from './Chat';
import { Close, Logo, Minus, Refresh, Restore } from './Icons';
import { Overview } from './Overview';
import { Segmented, type Tab } from './Segmented';
import { Skeleton } from './Skeleton';
import { Button } from './bui/Button';
import LoadingState from './bui/LoadingState';
import { Shimmer } from './bui/Shimmer';

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
  const [flash, setFlash] = useState('');

  const run = useCallback(async (force: boolean) => {
    const u = normalizeUrl(location.href);
    const t0 = Date.now();
    setUrl(u); setLoading(true); setError(''); setFlash('');
    if (force) { setSummary(null); setChat([]); setTab('overview'); setMin(false); }
    try {
      if (!force) {
        const c = await send({ type: 'getCached', url: u });
        if (c.ok && c.cached) { setSummary(c.cached.summary); setTitle(c.cached.title); setChat(c.chat); return; }
      }
      const page = extractPage();
      setTitle(page.title);
      const r = await send({ type: 'summarize', url: u, title: page.title, content: page.content, force });
      if (!r.ok) throw new Error(r.error);
      // keep the skeleton visible briefly so a fast re-summarize still reads as "something happened"
      if (force) await new Promise((res) => setTimeout(res, Math.max(0, 500 - (Date.now() - t0))));
      setSummary(r.summary); setChat(r.chat);
      if (force) { setFlash('已更新'); setTimeout(() => setFlash(''), 2000); }
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
          className="fixed right-5 top-5 flex flex-col overflow-hidden bg-white font-sans text-zinc-900 antialiased"
          style={{ width: 380, minWidth: 380, maxWidth: 380, boxSizing: 'border-box', borderRadius: 14, boxShadow: '0 8px 24px rgba(0,0,0,.1)', height: min ? 'auto' : 'calc(100vh - 40px)', border: '1px solid rgba(0,0,0,.06)' }}
        >
          <header
            className={`flex h-12 shrink-0 items-center justify-between px-4 ${min ? 'cursor-pointer hover:bg-zinc-50' : ''}`}
            title={min ? '点击还原' : undefined}
            onClick={() => min && setMin(false)}
          >
            <div className="flex min-w-0 items-center gap-2">
              <Logo /><span className="text-[14px] font-semibold">Open Mind</span>
              {min && <span className="min-w-0 truncate text-[12px] text-ink-2">· {loading ? <Shimmer>总结中…</Shimmer> : title}</span>}
            </div>
            <div className="flex items-center gap-1 text-ink-2">
              <Button variant="quiet" size="icon" title={min ? '还原' : '最小化'} aria-label={min ? '还原' : '最小化'}
                onClick={(e) => { e.stopPropagation(); setMin((m) => !m); }}>
                {min ? <Restore /> : <Minus />}
              </Button>
              <Button variant="quiet" size="icon" title="关闭" aria-label="关闭" onClick={(e) => { e.stopPropagation(); setOpen(false); }}><Close /></Button>
            </div>
          </header>
          {!min && (
            <>
              <div className="flex shrink-0 items-center gap-2 border-y border-zinc-100 px-4 py-2.5">
                <span className="min-w-0 flex-1 truncate text-[13px] font-medium text-zinc-700" title={title}>{title}</span>
                <Button variant="secondary" size="xs" onClick={() => run(true)} disabled={loading} title="忽略缓存，重新生成总结" className="shrink-0">
                  <Refresh className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} /> {loading ? '总结中…' : flash || '重新总结'}
                </Button>
              </div>
              <div className="relative min-h-0 flex-1">
                {tab === 'overview' ? (
                  <div className="om-scroll h-full overflow-y-auto">
                    {loading && <><div className="px-4 pt-4"><LoadingState label="正在总结" /></div><Skeleton /></>}
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
      <p>{noKey ? '请先在设置页填写 API Key。' : `总结失败：${error}`}</p>
      <div className="flex justify-center gap-2">
        {noKey
          ? <Button variant="primary" size="sm" onClick={() => send({ type: 'openOptions' })}>打开设置</Button>
          : <Button variant="secondary" size="sm" onClick={retry}>重试</Button>}
      </div>
    </div>
  );
}
