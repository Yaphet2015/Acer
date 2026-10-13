import { defineConfig } from 'wxt';

export default defineConfig({
  modules: ['@wxt-dev/module-react'],
  manifest: {
    name: 'Acer - AI Summary & Mind Map',
    short_name: 'Acer',
    description: 'Open-source AI summary, mind-map outline and chat for any web page. Bring your own OpenAI-compatible key (BYOK).',
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
