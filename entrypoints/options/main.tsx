import ReactDOM from 'react-dom/client';
import { useEffect, useState } from 'react';
import '@/assets/tailwind.css';
import { getSettings, saveSettings } from '@/lib/settings';
import { DEFAULT_SETTINGS, type Settings } from '@/lib/types';

function Options() {
  const [s, setS] = useState<Settings>(DEFAULT_SETTINGS);
  const [shortcut, setShortcut] = useState('');
  const [saved, setSaved] = useState(false);
  useEffect(() => {
    getSettings().then(setS);
    chrome.commands.getAll((c) => setShortcut(c.find((x) => x.name === 'toggle-overlay')?.shortcut || '未设置'));
  }, []);
  const field = (k: keyof Settings, label: string, type = 'text', ph = '') => (
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
        <button onClick={async () => { await saveSettings(s); setSaved(true); setTimeout(() => setSaved(false), 1500); }}
          className="rounded-full bg-zinc-900 px-4 py-2 text-[13px] text-white">{saved ? '已保存 ✓' : '保存'}</button>
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
