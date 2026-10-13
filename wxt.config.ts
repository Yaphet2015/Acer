import { defineConfig } from 'wxt';

export default defineConfig({
  modules: ['@wxt-dev/module-react'],
  manifest: {
    name: 'Acer - AI Summary & Mind Map',
    short_name: 'Acer',
    description: 'Open-source AI summary, mind-map outline and chat for any web page. Bring your own OpenAI-compatible key (BYOK).',
    permissions: ['storage'],
    host_permissions: ['<all_urls>'],
    commands: {
      'toggle-overlay': {
        suggested_key: { default: 'Ctrl+E', mac: 'Command+E' },
        description: 'Toggle the Acer overlay',
      },
    },
    action: { default_title: 'Acer', default_icon: { 16: 'icon/16.png', 32: 'icon/32.png', 48: 'icon/48.png', 128: 'icon/128.png' } },
  },
});
