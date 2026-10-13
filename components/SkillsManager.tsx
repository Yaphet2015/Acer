import { useEffect, useRef, useState } from 'react';
import { chromeKV } from '@/lib/storage';
import { createSkillStore, renderTemplate, validateSkill, type Skill } from '@/lib/skills';
import { Button } from './bui/Button';

type Draft = { id?: string; name: string; icon: string; template: string };
const EMPTY: Draft = { name: '', icon: '', template: '{{input}}' };
const inputCls = 'w-full rounded-lg border border-zinc-200 px-3 py-2 text-[14px] outline-none focus:border-accent focus:shadow-[0_0_0_3px_var(--accent-ring)]';

export function SkillsManager() {
  const store = useRef(createSkillStore(chromeKV)).current;
  const [skills, setSkills] = useState<Skill[]>([]);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [err, setErr] = useState('');
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const reload = () => store.list().then(setSkills);
  useEffect(() => { reload(); }, []);

  const save = async () => {
    if (!draft) return;
    const e = validateSkill(draft); if (e) { setErr(e); return; }
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
          <p className="text-[12px] text-zinc-500">对话输入框上方的快捷指令。模板支持 <code>{'{{input}}'}</code>（输入框文字，留空时用页面选中文字）、<code>{'{{selection}}'}</code>、<code>{'{{page_title}}'}</code>。</p>
        </div>
        {!draft && <Button variant="primary" size="sm" className="shrink-0 whitespace-nowrap" onClick={() => { setDraft({ ...EMPTY }); setErr(''); }}>＋ 新建</Button>}
      </div>

      {draft && (
        <div className="space-y-3 rounded-card bg-zinc-50 p-4 shadow-card" data-skill-editor>
          <div className="flex gap-2">
            <input aria-label="图标" value={draft.icon} onChange={(e) => setDraft({ ...draft, icon: e.target.value })} placeholder="😀" maxLength={4} className={`${inputCls} w-16 text-center`} />
            <input aria-label="名称" value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} placeholder="名称，例如：改写得更正式" className={inputCls} />
          </div>
          <textarea aria-label="提示词模板" value={draft.template} rows={4} onChange={(e) => setDraft({ ...draft, template: e.target.value })} className={`${inputCls} resize-y font-mono text-[13px]`} />
          <p className="text-[12px] text-zinc-500">预览：<span className="whitespace-pre-wrap text-zinc-700">{renderTemplate(draft.template, { input: '（输入框文字）', selection: '（选中文字）', page_title: '（页面标题）' })}</span></p>
          {err && <p className="text-[12px] text-red-600">{err}</p>}
          <div className="flex gap-2">
            <Button variant="primary" size="sm" onClick={save}>{draft.id ? '保存修改' : '添加'}</Button>
            <Button variant="secondary" size="sm" onClick={() => { setDraft(null); setErr(''); }}>取消</Button>
          </div>
        </div>
      )}

      <ul className="divide-y divide-zinc-100 rounded-card bg-white shadow-card" data-skill-list>
        {skills.length === 0 && <li className="px-4 py-3 text-[13px] text-zinc-400">还没有 Skill。</li>}
        {skills.map((s, i) => (
          <li key={s.id} className="flex items-center gap-3 px-4 py-2.5">
            <span className="w-6 text-center text-[16px]" aria-hidden>{s.icon || '⚡'}</span>
            <div className="min-w-0 flex-1">
              <div className="text-[13px] font-medium text-zinc-900">{s.name}{s.builtin && <span className="ml-1.5 rounded bg-zinc-100 px-1 text-[10px] font-normal text-zinc-500">内置</span>}</div>
              <div className="truncate text-[12px] text-zinc-500">{s.template.replace(/\s+/g, ' ')}</div>
            </div>
            {confirmId === s.id ? (
              <span className="flex items-center gap-1.5 text-[12px]">
                <span className="text-zinc-600">确定删除？</span>
                <Button variant="accent" size="xs" className="!bg-red !text-white" onClick={async () => { await store.remove(s.id); setConfirmId(null); reload(); }}>删除</Button>
                <Button variant="secondary" size="xs" onClick={() => setConfirmId(null)}>取消</Button>
              </span>
            ) : (
              <span className="flex items-center gap-0.5 text-zinc-500">
                <Button variant="quiet" size="icon" title="上移" aria-label="上移" disabled={i === 0} onClick={async () => { await store.move(s.id, -1); reload(); }}>↑</Button>
                <Button variant="quiet" size="icon" title="下移" aria-label="下移" disabled={i === skills.length - 1} onClick={async () => { await store.move(s.id, 1); reload(); }}>↓</Button>
                <Button variant="quiet" size="xs" onClick={() => { setDraft({ id: s.id, name: s.name, icon: s.icon ?? '', template: s.template }); setErr(''); }}>编辑</Button>
                <Button variant="quiet" size="xs" className="text-red" onClick={() => setConfirmId(s.id)}>删除</Button>
              </span>
            )}
          </li>
        ))}
      </ul>
      <button type="button" className="text-[12px] text-zinc-500 underline" onClick={async () => { await store.resetDefaults(); reload(); }}>恢复内置默认 Skills</button>
    </section>
  );
}
