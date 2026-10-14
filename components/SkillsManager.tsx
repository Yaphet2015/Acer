import { useEffect, useRef, useState } from 'react';
import { chromeKV } from '@/lib/storage';
import { createSkillStore, localizeSkill, renderTemplate, validateSkill, type Skill } from '@/lib/skills';
import { useLang, useT } from './i18n';
import { Button } from './bui/Button';

type Draft = { id?: string; name: string; icon: string; template: string };
const EMPTY: Draft = { name: '', icon: '', template: '{{input}}' };
const inputCls = 'w-full rounded-lg border border-zinc-200 px-3 py-2 text-[14px] outline-none focus:border-accent focus:shadow-[0_0_0_3px_var(--accent-ring)]';

export function SkillsManager() {
  const t = useT(); const lang = useLang();
  const store = createSkillStore(chromeKV, lang);
  const [skills, setSkills] = useState<Skill[]>([]);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [err, setErr] = useState('');
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const reload = () => store.list().then((l) => setSkills(l.map((s) => localizeSkill(s, lang))));
  useEffect(() => { reload(); }, [lang]);

  const save = async () => {
    if (!draft) return;
    const e = validateSkill(draft, lang); if (e) { setErr(e); return; }
    try {
      if (draft.id) await store.update(draft.id, { name: draft.name, icon: draft.icon, template: draft.template });
      else await store.add({ name: draft.name, icon: draft.icon, template: draft.template });
      setDraft(null); setErr(''); reload();
    } catch (x: any) { setErr(x.message); }
  };

  return (
    <section className="space-y-3 border-t border-zinc-100 pt-6" data-skills-manager>
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-[15px] font-semibold">Skills</h2>
          <p className="text-[12px] text-zinc-500">{t.skillsDesc[0]}<code>{'{{input}}'}</code>{t.skillsDesc[1]}<code>{'{{selection}}'}</code>{t.skillsDesc[2]}<code>{'{{page_title}}'}</code>{t.skillsDesc[3]}</p>
        </div>
        {!draft && <Button variant="primary" size="sm" className="shrink-0 whitespace-nowrap" onClick={() => { setDraft({ ...EMPTY }); setErr(''); }}>{t.newSkill}</Button>}
      </div>

      {draft && (
        <div className="space-y-3 rounded-card bg-zinc-50 p-4 shadow-card" data-skill-editor>
          <div className="flex gap-2">
            <input aria-label={t.icon} value={draft.icon} onChange={(e) => setDraft({ ...draft, icon: e.target.value })} placeholder="😀" maxLength={4} className={`${inputCls} w-16 text-center`} />
            <input aria-label={t.name} value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} placeholder={t.namePlaceholder} className={inputCls} />
          </div>
          <textarea aria-label={t.template} value={draft.template} rows={4} onChange={(e) => setDraft({ ...draft, template: e.target.value })} className={`${inputCls} resize-y font-mono text-[13px]`} />
          <p className="text-[12px] text-zinc-500">{t.preview}<span className="whitespace-pre-wrap text-zinc-700">{renderTemplate(draft.template, t.previewVars)}</span></p>
          {err && <p className="text-[12px] text-red-600">{err}</p>}
          <div className="flex gap-2">
            <Button variant="primary" size="sm" onClick={save}>{draft.id ? t.saveChanges : t.add}</Button>
            <Button variant="secondary" size="sm" onClick={() => { setDraft(null); setErr(''); }}>{t.cancel}</Button>
          </div>
        </div>
      )}

      <ul className="divide-y divide-zinc-100 rounded-card bg-white shadow-card" data-skill-list>
        {skills.length === 0 && <li className="px-4 py-3 text-[13px] text-zinc-400">{t.noSkills}</li>}
        {skills.map((s, i) => (
          <li key={s.id} className="flex items-center gap-3 px-4 py-2.5">
            <span className="w-6 text-center text-[16px]" aria-hidden>{s.icon || '⚡'}</span>
            <div className="min-w-0 flex-1">
              <div className="text-[13px] font-medium text-zinc-900">{s.name}{s.builtin && <span className="ml-1.5 rounded bg-zinc-100 px-1 text-[10px] font-normal text-zinc-500">{t.builtin}</span>}</div>
              <div className="truncate text-[12px] text-zinc-500">{s.template.replace(/\s+/g, ' ')}</div>
            </div>
            {confirmId === s.id ? (
              <span className="flex items-center gap-1.5 text-[12px]">
                <span className="text-zinc-600">{t.confirmDelete}</span>
                <Button variant="accent" size="xs" className="!bg-red !text-white" onClick={async () => { await store.remove(s.id); setConfirmId(null); reload(); }}>{t.delete}</Button>
                <Button variant="secondary" size="xs" onClick={() => setConfirmId(null)}>{t.cancel}</Button>
              </span>
            ) : (
              <span className="flex items-center gap-0.5 text-zinc-500">
                <Button variant="quiet" size="icon" title={t.moveUp} aria-label={t.moveUp} disabled={i === 0} onClick={async () => { await store.move(s.id, -1); reload(); }}>↑</Button>
                <Button variant="quiet" size="icon" title={t.moveDown} aria-label={t.moveDown} disabled={i === skills.length - 1} onClick={async () => { await store.move(s.id, 1); reload(); }}>↓</Button>
                <Button variant="quiet" size="xs" onClick={() => { setDraft({ id: s.id, name: s.name, icon: s.icon ?? '', template: s.template }); setErr(''); }}>{t.edit}</Button>
                <Button variant="quiet" size="xs" className="text-red" onClick={() => setConfirmId(s.id)}>{t.delete}</Button>
              </span>
            )}
          </li>
        ))}
      </ul>
      <button type="button" className="text-[12px] text-zinc-500 underline" onClick={async () => { await store.resetDefaults(); reload(); }}>{t.resetSkills}</button>
    </section>
  );
}
