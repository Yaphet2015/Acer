import ReactDOM from 'react-dom/client';
import { useEffect, useRef, useState } from 'react';
import '@/assets/tailwind.css';
import { getSettings, saveSettings } from '@/lib/settings';
import { Button } from '@/components/bui/Button';
import { useMock } from '@/lib/mock';
import { ModelCombobox } from '@/components/ModelCombobox';
import type { TestResult } from '@/lib/models';
import { DEFAULT_SETTINGS, type Settings } from '@/lib/types';

function Options() {
  const [s, setS] = useState<Settings>(DEFAULT_SETTINGS);
  const [shortcut, setShortcut] = useState('');
  const [saved, setSaved] = useState(false);
  const [models, setModels] = useState<string[]>([]);
  const [mLoading, setMLoading] = useState(false);
  const [mError, setMError] = useState('');
  const [testing, setTesting] = useState(false);
  const [test, setTest] = useState<TestResult | null>(null);
  const isLocal = /^https?:\/\/(localhost|127\.0\.0\.1|\[::1\])(:|\/|$)/.test(s.baseUrl);
  const canFetch = /^https?:\/\//.test(s.baseUrl) && (!!s.apiKey || isLocal);
  const reqId = useRef(0);
  const fetchModels = async () => {
    if (!canFetch) return;
    const id = ++reqId.current;
    setMLoading(true); setMError('');
    const r = await chrome.runtime.sendMessage({ type: 'listModels', settings: { baseUrl: s.baseUrl, apiKey: s.apiKey } });
    if (id !== reqId.current) return; // stale
    setMLoading(false);
    if (r?.ok) setModels(r.models); else { setModels([]); setMError(r?.error ?? '未知错误'); }
  };
  useEffect(() => { // debounced auto-fetch when Base URL / key change
    if (!canFetch) { setModels([]); setMError(''); return; }
    setMLoading(true); setMError(''); reqId.current++; // show loading immediately; drop in-flight results
    const t = setTimeout(fetchModels, 600);
    return () => clearTimeout(t);
  }, [s.baseUrl, s.apiKey]);
  const runTest = async () => {
    setTesting(true); setTest(null);
    const r = await chrome.runtime.sendMessage({ type: 'testConnection', settings: s });
    setTesting(false);
    setTest(r?.ok ? r.result : { ok: false, ms: 0, error: r?.error ?? '未知错误' });
  };
  useEffect(() => {
    getSettings().then(setS);
    chrome.commands.getAll((c) => setShortcut(c.find((x) => x.name === 'toggle-overlay')?.shortcut || ''));
  }, []);
  const field = (k: 'baseUrl' | 'apiKey' | 'model', label: string, type = 'text', ph = '') => (
    <label className="block space-y-1">
      <span className="text-[13px] font-medium text-zinc-700">{label}</span>
      <input type={type} value={s[k]} placeholder={ph} onChange={(e) => setS({ ...s, [k]: e.target.value })}
        className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-[14px] outline-none focus:border-accent focus:shadow-[0_0_0_3px_var(--accent-ring)]" />
    </label>
  );
  return (
    <div className="mx-auto max-w-lg space-y-6 p-10 font-sans text-zinc-900">
      <h1 className="text-xl font-semibold">Open Mind 设置</h1>
      <section className="space-y-4">
        {field('baseUrl', 'Base URL（OpenAI 兼容）', 'text', 'https://api.openai.com/v1')}
        {field('apiKey', 'API Key', 'password', 'sk-...')}
        <div className="space-y-1">
          <span className="text-[13px] font-medium text-zinc-700">Model</span>
          <ModelCombobox value={s.model} onChange={(model) => setS({ ...s, model })} models={models} loading={mLoading} error={mError} onRefresh={fetchModels} canFetch={canFetch} />
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Button variant="secondary" size="sm" onClick={runTest} disabled={testing || !s.model || !canFetch}>{testing ? '测试中…' : '测试连接'}</Button>
          <span data-test-result className="text-[13px]">
            {testing && <span className="text-zinc-500">正在向 {s.model} 发送测试请求…</span>}
            {test?.ok && <span className="text-green-700">✓ 连接成功 · {test.ms} ms{test.reply ? ` · 回复：${test.reply}` : ''}</span>}
            {test && !test.ok && <span className="text-red-600">✗ 连接失败：{test.error}</span>}
          </span>
        </div>
        {(() => {
          const auto = !s.mock && useMock(s); // no key (and not a local server) → mock is used automatically
          return (
            <div className="space-y-1">
              <label className="flex items-center gap-2 text-[13px] text-zinc-700">
                <input type="checkbox" checked={s.mock || auto} disabled={auto} onChange={(e) => setS({ ...s, mock: e.target.checked })} />
                <span className="font-medium">Mock 模式</span>
                {auto && <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[11px] text-amber-800">未填 Key → 自动启用</span>}
                {s.mock && <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-[11px] text-zinc-700">已手动开启</span>}
              </label>
              <p className="pl-6 text-[12px] leading-relaxed text-zinc-500">
                不调用模型，返回模拟总结和逐字输出的模拟对话，用于预览界面。
                {auto ? '当前没有填写 API Key，所以会自动使用 Mock；填写 Key 后可自由开关。' : '没有填写 API Key 时会自动使用（localhost 等本地地址除外）。'}
              </p>
            </div>
          );
        })()}
        <Button variant="primary" onClick={async () => { await saveSettings(s); setSaved(true); setTimeout(() => setSaved(false), 1500); }}>
          {saved ? '已保存 ✓' : '保存'}</Button>
      </section>
      <section className="space-y-2 border-t border-zinc-100 pt-6 text-[13px] text-zinc-700">
        <p>当前快捷键：<kbd className="rounded bg-zinc-100 px-1.5 py-0.5">{shortcut || (/Mac/.test(navigator.platform) ? '⌘E（页面内兜底）' : 'Ctrl+E（页面内兜底）')}</kbd></p>
        <p className="text-[12px] text-zinc-500">
          默认 Mac 为 ⌘E、其他系统为 Ctrl+E，按一次显示、再按一次隐藏。
          {shortcut ? '' : ' Chrome 没有分配该快捷键（可能与浏览器或其他扩展冲突），目前由页面内脚本兜底处理；在 chrome:// 等页面上不可用。'}
        </p>
        <button onClick={() => chrome.tabs.create({ url: 'chrome://extensions/shortcuts' })} className="text-accent underline">
          前往 chrome://extensions/shortcuts 自定义快捷键
        </button>
      </section>
    </div>
  );
}
ReactDOM.createRoot(document.getElementById('root')!).render(<Options />);
