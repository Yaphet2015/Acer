import type { Skill } from '@/lib/skills';
import { useT } from './i18n';
import type { Messages } from '@/lib/i18n';
import { Fork } from './Icons';

export type SlashItem = { key: string; cmd: string; desc: string; icon?: React.ReactNode; skill?: Skill };

export function slashItems(input: string, skills: Skill[], t: Pick<Messages, 'slashSide'>): SlashItem[] {
  if (!input.startsWith('/')) return [];
  const q = input.slice(1).split(/\s/)[0]!.toLowerCase();
  if (/\s/.test(input) && !/^\/side\b/i.test(input)) return [];
  const all: SlashItem[] = [
    { key: 'side', cmd: '/side', desc: t.slashSide, icon: <Fork className="mx-auto h-3.5 w-3.5 text-ink-2" /> },
    ...skills.map((s) => ({ key: s.id, cmd: '/' + s.name, desc: 'Skill · ' + s.template.replace(/\s+/g, ' ').slice(0, 28) + '…', icon: s.icon, skill: s })),
  ];
  if (/^\/side\s/i.test(input)) return all.slice(0, 1);
  return all.filter((i) => i.cmd.slice(1).toLowerCase().includes(q));
}

export function SlashMenu({ items, active, onPick, onHover }: { items: SlashItem[]; active: number; onPick: (i: SlashItem) => void; onHover: (i: number) => void }) {
  if (!items.length) return null;
  const t = useT();
  return (
    <div role="listbox" data-slash-menu className="absolute bottom-full left-3 right-3 mb-1.5 max-h-56 overflow-y-auto rounded-card bg-surface p-1 shadow-card" style={{ animation: 'pop-in 150ms cubic-bezier(0.23,1,0.32,1) both', transformOrigin: 'bottom left' }}>
      <div className="px-2 pb-1 pt-0.5 text-[11px] text-ink-3">{t.slashHeader}</div>
      {items.map((it, i) => (
        <div key={it.key} role="option" aria-selected={i === active}
          onMouseDown={(e) => { e.preventDefault(); onPick(it); }} onMouseEnter={() => onHover(i)}
          className={`flex cursor-pointer items-center gap-2 rounded-control px-2 py-1.5 ${i === active ? 'bg-accent-tint' : ''}`}>
          <span className="w-4 text-center text-[13px]" aria-hidden>{it.icon ?? '⚡'}</span>
          <span className={`text-[13px] font-medium ${i === active ? 'text-accent-ink' : 'text-ink'}`}>{it.cmd}</span>
          <span className="min-w-0 flex-1 truncate text-[12px] text-ink-3">{it.desc}</span>
        </div>
      ))}
    </div>
  );
}
