import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { chromeKV } from '@/lib/cache';
import { getSession, MAIN_ID, parseSide, type SessionsState } from '@/lib/sessions';
import { createSkillStore, renderTemplate, type Skill } from '@/lib/skills';
import type { ChatMessage } from '@/lib/types';
import { SessionChips } from './SessionChips';
import { SkillsRow } from './SkillsRow';
import { SlashMenu, slashItems, type SlashItem } from './SlashMenu';

const LINE_PX = 18; // 13px * 1.4 line-height, rounded
const MAX_LINES = 6;
const send = (msg: any) => chrome.runtime.sendMessage(msg) as Promise<any>;

export function Chat({ url, pageTitle, disabled, reloadKey }: { url: string; pageTitle: string; disabled: boolean; reloadKey: number }) {
  const [state, setState] = useState<SessionsState | null>(null);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const [skills, setSkills] = useState<Skill[]>([]);
  const [slashActive, setSlashActive] = useState(0);
  const end = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const lastSelection = useRef('');
  const skillStore = useRef(createSkillStore(chromeKV())).current;

  const sid = state?.active ?? MAIN_ID;
  const messages: ChatMessage[] = (state && getSession(state, sid)?.messages) || [];

  useEffect(() => { send({ type: 'getSessions', url }).then((r) => r?.ok && setState(r.state)); }, [url, reloadKey]);
  const loadSkills = useCallback(() => skillStore.ordered().then(setSkills), [skillStore]);
  useEffect(() => {
    loadSkills();
    const onChange = (c: Record<string, unknown>, area: string) => { if (area === 'local' && ('skills' in c || 'skillsRecent' in c)) loadSkills(); };
    chrome.storage.onChanged.addListener(onChange);
    return () => chrome.storage.onChanged.removeListener(onChange);
  }, [loadSkills]);
  useEffect(() => { // remember the page selection for {{selection}}
    const onSel = () => { const t = window.getSelection()?.toString().trim(); if (t) lastSelection.current = t; };
    document.addEventListener('selectionchange', onSel); return () => document.removeEventListener('selectionchange', onSel);
  }, []);
  useEffect(() => { end.current?.scrollIntoView({ block: 'end' }); }, [messages.length, messages[messages.length - 1]?.content]);

  const patchMessages = (id: string, f: (m: ChatMessage[]) => ChatMessage[]) =>
    setState((s) => s && { ...s, sessions: s.sessions.map((x) => (x.id === id ? { ...x, messages: f(x.messages) } : x)) });

  const stream = (text: string, targetSid: string, label?: string) => {
    setBusy(true);
    patchMessages(targetSid, (m) => [...m, { role: 'user', content: text, ...(label ? { label } : {}) }, { role: 'assistant', content: '' }]);
    const port = chrome.runtime.connect({ name: 'chat' });
    const patch = (f: (s: string) => string) => patchMessages(targetSid, (m) => { const c = [...m]; c[c.length - 1] = { role: 'assistant', content: f(c[c.length - 1]!.content) }; return c; });
    port.onMessage.addListener((msg) => {
      if (msg.delta) patch((s) => s + msg.delta);
      if (msg.error) patch((s) => s + (s ? '\n\n' : '') + '⚠️ ' + msg.error);
      if (msg.done || msg.error) { setBusy(false); port.disconnect(); }
    });
    port.postMessage({ url, text, sid: targetSid, label });
  };

  const fork = async (firstMessage = '') => {
    const r = await send({ type: 'forkSession', url, from: sid });
    if (!r?.ok) return;
    setState(r.state);
    if (firstMessage) stream(firstMessage, r.id);
  };
  const switchTo = async (id: string) => { const r = await send({ type: 'setActiveSession', url, id }); if (r?.ok) setState(r.state); };
  const closeIt = async (id: string) => { const r = await send({ type: 'closeSession', url, id }); if (r?.ok) setState(r.state); };

  const runSkill = async (s: Skill, rawInput = input) => {
    if (busy || disabled) return;
    const prompt = renderTemplate(s.template, { input: rawInput, selection: lastSelection.current, page_title: pageTitle });
    setInput('');
    await skillStore.markUsed(s.id);
    stream(prompt, sid, `${s.icon ? s.icon + ' ' : ''}${s.name}${rawInput.trim() ? '：' + rawInput.trim() : ''}`);
  };

  const submit = () => {
    const text = input.trim();
    if (!text || busy || disabled) return;
    const side = parseSide(text);
    setInput('');
    if (side) { fork(side.message); return; }
    stream(text, sid);
  };

  const items = slashItems(input, skills);
  const showSlash = items.length > 0 && !busy;
  useEffect(() => setSlashActive(0), [input]);
  const pickSlash = (it: SlashItem) => {
    if (it.skill) { runSkill(it.skill, ''); return; }
    setInput('/side '); inputRef.current?.focus();
  };

  // auto-grow 1..6 lines, then scroll
  useLayoutEffect(() => {
    const el = inputRef.current; if (!el) return;
    el.style.height = 'auto';
    const max = LINE_PX * MAX_LINES;
    el.style.height = `${Math.min(Math.max(el.scrollHeight, LINE_PX), max)}px`;
    el.style.overflowY = el.scrollHeight > max ? 'auto' : 'hidden';
  }, [input]);
  const canSend = !!input.trim() && !busy && !disabled;

  return (
    <div className="flex h-full flex-col">
      {state && <SessionChips state={state} onSwitch={switchTo} onClose={closeIt} onFork={() => fork()} disabled={busy || disabled} />}
      <div className="om-scroll flex min-h-0 flex-1 flex-col gap-2.5 overflow-y-auto px-4 py-3">
        {!messages.length && (
          <p className="pt-8 text-center text-[13px] leading-relaxed text-ink-3">
            {sid === MAIN_ID ? '关于这个页面，随便问点什么。' : '这是一个空的支线会话。'}<br />输入 <span className="text-ink-2">/</span> 查看命令
          </p>
        )}
        {messages.map((m, i) => {
          const streaming = busy && i === messages.length - 1 && m.role === 'assistant';
          return m.role === 'user' ? (
            <div key={i} className="flex justify-end pl-14" style={{ animation: 'pop-in 200ms cubic-bezier(0.23,1,0.32,1) both' }}>
              <div className={`whitespace-pre-wrap break-words rounded-xl px-3 py-1.5 text-[13px] leading-[1.4] ${m.label ? 'bg-accent-tint text-accent-ink' : 'bg-field text-ink'}`} title={m.label ? m.content : undefined}>
                {m.label ?? m.content}
              </div>
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
      <div className="relative shrink-0">
        {showSlash && <SlashMenu items={items} active={slashActive} onPick={pickSlash} onHover={setSlashActive} />}
        <SkillsRow skills={skills} onRun={(s) => runSkill(s)} disabled={busy || disabled} />
        {/* composer — adapted from Beautiful UI ChatComposer (https://www.beautifului.dev/r/chat-composer.json, MIT) */}
        <div className="px-3 pb-1">
          <div
            role="presentation"
            onClick={() => inputRef.current?.focus()}
            className="flex cursor-text flex-col gap-2 rounded-control border border-line bg-field p-2.5 shadow-[0_1px_2px_rgba(0,0,0,0.035)] transition-[border-color,box-shadow] duration-150 focus-within:border-accent focus-within:shadow-[0_0_0_3px_var(--accent-ring)]"
          >
            <textarea
              ref={inputRef} rows={1} value={input} disabled={disabled}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                e.stopPropagation();
                if (e.nativeEvent.isComposing) return;
                if (showSlash) {
                  if (e.key === 'ArrowDown') { e.preventDefault(); setSlashActive((a) => (a + 1) % items.length); return; }
                  if (e.key === 'ArrowUp') { e.preventDefault(); setSlashActive((a) => (a - 1 + items.length) % items.length); return; }
                  if (e.key === 'Escape') { e.preventDefault(); setInput(''); return; }
                  const it = items[slashActive];
                  const typedSide = /^\/side(\s|$)/i.test(input);
                  if (it && (e.key === 'Tab' || (e.key === 'Enter' && !e.shiftKey && !(typedSide && it.key === 'side')))) { e.preventDefault(); pickSlash(it); return; }
                }
                if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); submit(); }
              }}
              placeholder={disabled ? '请先等待总结完成…' : '继续提问…（/ 查看命令，Enter 发送，Shift+Enter 换行）'}
              aria-label="对话输入框"
              className="om-scroll block w-full resize-none overflow-hidden bg-transparent text-[13px] leading-[18px] text-ink outline-none placeholder:text-ink-3"
            />
            <div className="flex items-center justify-between">
              <span className="text-[11px] text-ink-3">{sid === MAIN_ID ? '' : `当前：${getSession(state!, sid)?.name}`}</span>
              <button
                type="button" aria-label="发送" title="发送" disabled={!canSend} onClick={submit}
                className="flex size-7 items-center justify-center rounded-[8px] transition-[background-color,color,transform] duration-200 enabled:active:scale-[0.96]"
                style={{ background: canSend ? 'var(--accent)' : 'var(--line-strong)', color: canSend ? '#fff' : 'var(--ink-2)' }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M12 19V5M5 12l7-7 7 7" /></svg>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
