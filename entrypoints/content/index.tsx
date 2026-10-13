import ReactDOM from 'react-dom/client';
import '@/assets/tailwind.css';
import { App } from '@/components/App';
import { bus } from '@/components/bus';

export default defineContentScript({
  matches: ['<all_urls>'],
  cssInjectionMode: 'ui',
  async main(ctx) {
    let ui: Awaited<ReturnType<typeof createShadowRootUi>> | null = null;
    chrome.runtime.onMessage.addListener((msg) => {
      if (msg?.type !== 'toggle') return;
      if (!ui) {
        createShadowRootUi(ctx, {
          name: 'open-mind-overlay',
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
            root.render(<App />);
            return root;
          },
          onRemove(root) { root?.unmount(); },
        }).then((u) => { ui = u; u.mount(); });
      } else bus.emit('toggle');
    });
  },
});
