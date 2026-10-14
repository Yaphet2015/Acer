import { motion } from 'framer-motion';
import { useT } from './i18n';
export type Tab = 'overview' | 'chat';
export function Segmented({ value, onChange, className = 'mx-auto' }: { value: Tab; onChange: (t: Tab) => void; className?: string }) {
  const m = useT();
  const TABS: { id: Tab; label: string }[] = [{ id: 'overview', label: m.tabOverview }, { id: 'chat', label: m.tabChat }];
  return (
    <div className={`flex w-fit shrink-0 rounded-full bg-zinc-100 p-0.5 ${className}`} onClick={(e) => e.stopPropagation()}>
      {TABS.map((t) => (
        <button key={t.id} onClick={() => onChange(t.id)} className="relative rounded-full px-4 py-1 text-[13px] font-medium">
          {value === t.id && (
            <motion.span layoutId="acer-pill" className="absolute inset-0 rounded-full bg-white shadow-sm"
              transition={{ duration: 0.25, ease: 'easeOut' }} />
          )}
          <motion.span className="relative" animate={{ color: value === t.id ? '#09090b' : '#71717a' }} transition={{ duration: 0.25, ease: 'easeOut' }}>
            {t.label}
          </motion.span>
        </button>
      ))}
    </div>
  );
}
