import ReactDOM from 'react-dom/client';
import { useEffect, useState } from 'react';
import '@/assets/tailwind.css';
import { getSettings, saveSettings } from '@/lib/settings';
import { Button } from '@/components/bui/Button';
import { useMock } from '@/lib/mock';
import { DEFAULT_SETTINGS, type Settings } from '@/lib/types';

function Options() {
  const [s, setS] = useState<Settings>(DEFAULT_SETTINGS);
  const [shortcut, setShortcut] = useState('');
  const [saved, setSaved] = useState(false);
  useEffect(() => {
    getSettings().then(setS);
    chrome.commands.getAll((c) => setShortcut(c.find((x) => x.name === 'toggle-overlay')?.shortcut || '未设置'));
  }, []);
  const field = (k: 'baseUrl' | 'apiKey' | 'model', label: string, type = 'text', ph = '') => (
    <label className="block space-y-1">
      <span className="text-[13px] font-medium text-zinc-700">{label}</span>
      <input type={type} value={s[k]} placeholder={ph} onChange={(e) => setS({ ...s, [k]: e.target.value })}
        className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-[14px] outline-none focus:border-zinc-400" />
    </label>
  );
  return (
    <div className="mx-auto max-w-lg space-y-6 p-10 font-sans text-zinc-900">
      <h1 className="text-xl font-semibold">Open Mind 设置</h1>
      <section className="space-y-4">
        {field('baseUrl', 'Base URL（OpenAI 兼容）', 'text', 'https://api.openai.com/v1')}
        {field('apiKey', 'API Key', 'password', 'sk-...')}
        {field('model', 'Model', 'text', 'gpt-4o-mini')}
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
        <p>当前快捷键：<kbd className="rounded bg-zinc-100 px-1.5 py-0.5">{shortcut}</kbd></p>
        <button onClick={() => chrome.tabs.create({ url: 'chrome://extensions/shortcuts' })} className="text-violet-600 underline">
          前往 chrome://extensions/shortcuts 自定义快捷键
        </button>
      </section>
    </div>
  );
}
ReactDOM.createRoot(document.getElementById('root')!).render(<Options />);
