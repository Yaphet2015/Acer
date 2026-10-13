import { useEffect, useRef, useState } from 'react';
import type { ChatMessage } from '@/lib/types';

export function Chat({ url, messages, setMessages, disabled }: {
  url: string; messages: ChatMessage[]; setMessages: (f: (m: ChatMessage[]) => ChatMessage[]) => void; disabled: boolean;
}) {
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const end = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
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

  const canSend = !!input.trim() && !busy && !disabled;
  return (
    <div className="flex h-full flex-col">
      <div className="om-scroll flex min-h-0 flex-1 flex-col gap-2.5 overflow-y-auto px-4 py-3">
        {!messages.length && <p className="pt-8 text-center text-[13px] text-ink-3">关于这个页面，随便问点什么。</p>}
        {messages.map((m, i) => {
          const streaming = busy && i === messages.length - 1 && m.role === 'assistant';
          return m.role === 'user' ? (
            /* user bubble — Beautiful UI ChatComposer style */
            <div key={i} className="flex justify-end pl-14" style={{ animation: 'pop-in 200ms cubic-bezier(0.23,1,0.32,1) both' }}>
              <div className="whitespace-pre-wrap break-words rounded-xl bg-field px-3 py-1.5 text-[13px] leading-[1.4] text-ink">{m.content}</div>
            </div>
          ) : (
            <div key={i} className="whitespace-pre-wrap break-words text-[13px] leading-[1.65] text-ink">
              {m.content}
              {streaming && <span aria-hidden className="stream-caret is-streaming" />}
            </div>
          );
        })}
        <div ref={end} />
      </div>
      {/* composer — adapted from Beautiful UI ChatComposer (https://www.beautifului.dev/r/chat-composer.json, MIT) */}
      <div className="shrink-0 px-3 pb-1">
        <div
          role="presentation"
          onClick={() => inputRef.current?.focus()}
          className="flex cursor-text flex-col gap-2 rounded-control border border-line bg-field p-2.5 shadow-[0_1px_2px_rgba(0,0,0,0.035)] transition-[border-color,box-shadow] duration-150 focus-within:border-line-strong"
        >
          <textarea
            ref={inputRef} rows={1} value={input} disabled={disabled}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => { e.stopPropagation(); if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) { e.preventDefault(); send(); } }}
            placeholder={disabled ? '请先等待总结完成…' : '继续提问…（Enter 发送，Shift+Enter 换行）'}
            aria-label="对话输入框"
            className="max-h-24 min-h-[18px] resize-none bg-transparent text-[13px] leading-[1.4] text-ink outline-none placeholder:text-ink-3"
          />
          <div className="flex items-center justify-end">
            <button
              type="button" aria-label="发送" title="发送" disabled={!canSend} onClick={send}
              className="flex size-7 items-center justify-center rounded-[8px] transition-[background-color,color,transform] duration-200 enabled:active:scale-[0.96]"
              style={{ background: canSend ? 'var(--ink)' : 'var(--line-strong)', color: canSend ? 'var(--surface)' : 'var(--ink-2)' }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M12 19V5M5 12l7-7 7 7" /></svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
