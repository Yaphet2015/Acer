import { defineConfig } from 'wxt';

export default defineConfig({
  modules: ['@wxt-dev/module-react'],
  manifest: {
    name: 'Open Mind',
    description: 'Open-source AI page summary + outline (mind map) + chat. BYOK.',
    permissions: ['storage', 'activeTab', 'scripting'],
    host_permissions: ['<all_urls>'],
    commands: {
      'toggle-overlay': {
        suggested_key: { default: 'Alt+Shift+M', mac: 'Alt+Shift+M' },
        description: 'Toggle the Open Mind overlay',
      },
    },
    action: { default_title: 'Open Mind' },
  },
});
