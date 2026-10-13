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
          onMount(container) {
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
