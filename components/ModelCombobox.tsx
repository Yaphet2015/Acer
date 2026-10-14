import { useEffect, useMemo, useRef, useState } from 'react';
import { useT } from './i18n';

/** Searchable combobox: filter the fetched list, or type any custom model name. */
export function ModelCombobox({ value, onChange, models, loading, error, onRefresh, canFetch }: {
  value: string; onChange: (v: string) => void; models: string[]; loading: boolean; error: string; onRefresh: () => void; canFetch: boolean;
}) {
  const t = useT();
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const [query, setQuery] = useState<string | null>(null); // null = show full list (not filtering yet)
  const box = useRef<HTMLDivElement>(null);
  const filtered = useMemo(() => {
    const q = (query ?? '').trim().toLowerCase();
    return q ? models.filter((m) => m.toLowerCase().includes(q)) : models;
  }, [models, query]);
  useEffect(() => setActive(0), [query, models]);
  useEffect(() => {
    const onDoc = (e: MouseEvent) => { if (!box.current?.contains(e.target as Node)) setOpen(false); };
    document.addEventListener('mousedown', onDoc); return () => document.removeEventListener('mousedown', onDoc);
  }, []);
  const pick = (m: string) => { onChange(m); setQuery(null); setOpen(false); };

  return (
    <div ref={box} className="relative">
      <div className="flex gap-2">
        <input
          role="combobox" aria-expanded={open} aria-autocomplete="list" aria-label="Model"
          value={value} placeholder={t.modelPlaceholder}
          onFocus={() => setOpen(true)}
          onChange={(e) => { onChange(e.target.value); setQuery(e.target.value); setOpen(true); }}
          onKeyDown={(e) => {
            if (e.key === 'ArrowDown') { e.preventDefault(); setOpen(true); setActive((a) => Math.min(a + 1, filtered.length - 1)); }
            else if (e.key === 'ArrowUp') { e.preventDefault(); setActive((a) => Math.max(a - 1, 0)); }
            else if (e.key === 'Enter' && open && filtered[active]) { e.preventDefault(); pick(filtered[active]!); }
            else if (e.key === 'Escape') setOpen(false);
          }}
          className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-[14px] outline-none focus:border-accent focus:shadow-[0_0_0_3px_var(--accent-ring)]"
        />
        <button type="button" onClick={onRefresh} disabled={!canFetch || loading} title={t.refreshModels}
          className="shrink-0 rounded-lg border border-zinc-200 px-3 text-[13px] text-zinc-700 hover:bg-zinc-50 disabled:opacity-40">
          <span className={loading ? 'inline-block animate-spin' : ''}>↻</span> {t.refresh}
        </button>
      </div>
      <p className="mt-1 text-[12px] text-zinc-500" data-model-status>
        {!canFetch ? t.modelsNeedConfig
          : loading ? t.modelsLoading
          : error ? <span className="text-red-600">{t.modelsFailed(error)}</span>
          : t.modelsCount(models.length)}
      </p>
      {open && (models.length > 0 || loading) && (
        <ul role="listbox" className="absolute left-0 right-0 top-[42px] z-10 max-h-64 overflow-y-auto rounded-lg border border-zinc-200 bg-white py-1 shadow-lg">
          {loading && <li className="px-3 py-2 text-[13px] text-zinc-400">{t.loading}</li>}
          {!loading && filtered.length === 0 && <li className="px-3 py-2 text-[13px] text-zinc-400">{t.noModelMatch(value)}</li>}
          {!loading && filtered.map((m, i) => (
            <li key={m} role="option" aria-selected={m === value}
              onMouseDown={(e) => { e.preventDefault(); pick(m); }} onMouseEnter={() => setActive(i)}
              className={`flex cursor-pointer items-center justify-between px-3 py-1.5 text-[13px] ${i === active ? 'bg-zinc-100' : ''}`}>
              <span className="truncate">{m}</span>{m === value && <span className="text-zinc-500">✓</span>}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
