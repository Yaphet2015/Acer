import { useEffect, useRef, useState } from 'react';
import type { ChatMessage } from '@/lib/types';
import { Send } from './Icons';

export function Chat({ url, messages, setMessages, disabled }: {
  url: string; messages: ChatMessage[]; setMessages: (f: (m: ChatMessage[]) => ChatMessage[]) => void; disabled: boolean;
}) {
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const end = useRef<HTMLDivElement>(null);
  useEffect(() => { end.current?.scrollIntoView({ block: 'end' }); }, [messages]);

  const send = () => {
    const text = input.trim();
    if (!text || busy || disabled) return;
    setInput(''); setBusy(true);
    setMessages((m) => [...m, { role: 'user', content: text }, { role: 'assistant', content: '' }]);
    const port = chrome.runtime.connect({ name: 'chat' });
    const patch = (f: (s: string) => string) =>
      setMessages((m) => { const c = [...m]; c[c.length - 1] = { role: 'assistant', content: f(c[c.length - 1]!.content) }; return c; });
    port.onMessage.addListener((msg) => {
      if (msg.delta) patch((s) => s + msg.delta);
      if (msg.error) patch((s) => s + (s ? '\n\n' : '') + '⚠️ ' + msg.error);
      if (msg.done || msg.error) { setBusy(false); port.disconnect(); }
    });
    port.postMessage({ url, text });
  };

  return (
    <div className="flex h-full flex-col">
      <div className="om-scroll flex-1 space-y-3 overflow-y-auto px-4 py-4">
        {!messages.length && <p className="pt-8 text-center text-[13px] text-zinc-400">Ask anything about this page.</p>}
        {messages.map((m, i) => (
          <div key={i} className={m.role === 'user' ? 'flex justify-end' : ''}>
            <div className={`max-w-[88%] whitespace-pre-wrap break-words text-[13px] leading-[1.65] ${m.role === 'user' ? 'rounded-2xl rounded-br-md bg-zinc-900 px-3 py-2 text-white' : 'text-zinc-800'}`}>
              {m.content || (busy && i === messages.length - 1 ? <span className="inline-block h-3 w-1.5 animate-pulse bg-zinc-400" /> : '')}
            </div>
          </div>
        ))}
        <div ref={end} />
      </div>
      <div className="px-3 pb-2">
        <div className="flex items-end gap-2 rounded-xl border border-zinc-200 bg-white px-3 py-2 focus-within:border-zinc-400">
          <textarea rows={1} value={input} onChange={(e) => setInput(e.target.value)} disabled={disabled}
            onKeyDown={(e) => { e.stopPropagation(); if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) { e.preventDefault(); send(); } }}
            placeholder={disabled ? 'Summarize first…' : 'Ask a follow-up…'}
            className="max-h-24 flex-1 resize-none bg-transparent text-[13px] text-zinc-800 outline-none placeholder:text-zinc-400" />
          <button onClick={send} disabled={busy || !input.trim()} className="rounded-lg bg-zinc-900 p-1.5 text-white disabled:opacity-30"><Send className="h-3.5 w-3.5" /></button>
        </div>
      </div>
    </div>
  );
}
