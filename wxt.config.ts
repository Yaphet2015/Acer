import { defineConfig } from 'wxt';

export default defineConfig({
  modules: ['@wxt-dev/module-react'],
  manifest: {
    name: 'Acer',
    description: 'Open-source AI page summary + outline (mind map) + chat. BYOK.',
    permissions: ['storage', 'activeTab'],
    host_permissions: ['<all_urls>'],
    commands: {
      'toggle-overlay': {
        suggested_key: { default: 'Ctrl+E', mac: 'Command+E' },
        description: 'Toggle the Acer overlay',
      },
    },
    action: { default_title: 'Acer' },
  },
});
