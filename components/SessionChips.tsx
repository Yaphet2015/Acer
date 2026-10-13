import type { SessionsState } from '@/lib/sessions';
import { MAIN_ID } from '@/lib/sessions';
import { Fork } from './Icons';

export function SessionChips({ state, onSwitch, onClose, onFork, disabled }: {
  state: SessionsState; onSwitch: (id: string) => void; onClose: (id: string) => void; onFork: () => void; disabled: boolean;
}) {
  return (
    <div data-session-chips className="om-noscrollbar flex shrink-0 items-center gap-1 overflow-x-auto border-b border-zinc-100 px-3 py-1.5">
      {state.sessions.map((s) => {
        const active = s.id === state.active;
        return (
          <span key={s.id} className={`group inline-flex h-6 shrink-0 items-center rounded-chip text-[12px] transition-colors duration-100 ${active ? 'bg-accent-tint text-accent-ink' : 'text-ink-2 hover:bg-hover'}`}>
            <button type="button" onClick={() => onSwitch(s.id)} className={`flex h-full items-center gap-1 ${s.id === MAIN_ID ? 'px-2' : 'pl-2 pr-1'}`} title={s.id === MAIN_ID ? '主线会话' : `从「${state.sessions.find((x) => x.id === s.parent)?.name ?? '主线'}」分叉`}>
              {s.id !== MAIN_ID && <Fork className="h-3 w-3 opacity-70" />}{s.name}
              <span className="text-[10px] tabular-nums opacity-60">{Math.floor(s.messages.filter((m) => m.content).length / 2) || ''}</span>
            </button>
            {s.id !== MAIN_ID && (
              <button type="button" aria-label={`关闭${s.name}`} title={`关闭${s.name}`} onClick={() => onClose(s.id)}
                className="mr-0.5 flex size-4 items-center justify-center rounded-[4px] text-[12px] leading-none opacity-60 hover:bg-black/5 hover:opacity-100">×</button>
            )}
          </span>
        );
      })}
      <button type="button" onClick={onFork} disabled={disabled} title="分叉出一个支线会话（也可以输入 /side）"
        className="ml-auto inline-flex h-6 shrink-0 items-center gap-1 rounded-chip px-2 text-[12px] text-ink-3 hover:bg-hover hover:text-ink-2 disabled:opacity-40">
        <Fork className="h-3.5 w-3.5" /> 新支线
      </button>
    </div>
  );
}
