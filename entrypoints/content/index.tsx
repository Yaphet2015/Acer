import ReactDOM from 'react-dom/client';
import '@/assets/tailwind.css';
import { App } from '@/components/App';
import { LangProvider } from '@/components/i18n';
import { bus } from '@/components/bus';
import { rpc, TOGGLE } from '@/lib/messages';

export default defineContentScript({
  matches: ['<all_urls>'],
  cssInjectionMode: 'ui',
  async main(ctx) {
    let ui: Awaited<ReturnType<typeof createShadowRootUi>> | null = null;
    let last = 0;
    const toggle = () => {
      if (Date.now() - last < 200) return; // de-dupe command + keydown fallback
      last = Date.now();
      if (!ui) {
        createShadowRootUi(ctx, {
          name: 'acer-overlay',
          position: 'overlay',
          zIndex: 2147483646,
          anchor: 'html', // outside <body>, so body-level zoom/transform on the host page can't affect us
          onMount(container, _shadow, host) {
            // Cancel any CSS zoom inherited from the host page (e.g. html { zoom: .8 }) so the panel is always 380 CSS px.
            const fixZoom = () => {
              const z = (host.parentElement as any)?.currentCSSZoom ?? 1;
              host.style.setProperty('zoom', String(1 / (z || 1)), 'important');
            };
            fixZoom();
            window.addEventListener('resize', fixZoom);
            const root = ReactDOM.createRoot(container);
            root.render(<LangProvider><App /></LangProvider>);
            return root;
          },
          onRemove(root) { root?.unmount(); },
        }).then((u) => { ui = u; u.mount(); });
      } else bus.emit('toggle');
    };
    chrome.runtime.onMessage.addListener((msg) => { if (msg?.type === TOGGLE.type) toggle(); });

    // Fallback: if Chrome didn't assign the Ctrl+E / ⌘E command (conflict, or the user cleared it),
    // handle the key on the page ourselves. Not used when the user assigned a different shortcut.
    const isMac = /Mac|iPhone|iPad/.test(navigator.platform);
    let fallback = false;
    const refresh = () => rpc('getShortcut', {}).then((r) => { if (r.ok) fallback = !r.shortcut; });
    refresh();
    document.addEventListener('visibilitychange', () => { if (!document.hidden) refresh(); });
    window.addEventListener('keydown', (e) => {
      if (!fallback || e.repeat || e.altKey || e.shiftKey || e.key.toLowerCase() !== 'e') return;
      if (!(isMac ? e.metaKey && !e.ctrlKey : e.ctrlKey && !e.metaKey)) return;
      e.preventDefault(); e.stopPropagation();
      toggle();
    }, true);
  },
});
