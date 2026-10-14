/** UI strings for zh-CN and en. `zh` defines the shape; `en` must provide every key. */
export type Lang = 'zh-CN' | 'en';
export type LangPref = 'auto' | Lang;

/** zh* → zh-CN, anything else → en. An explicit preference wins over the browser language. */
export function resolveLang(pref: LangPref | undefined, uiLanguage: string): Lang {
  if (pref === 'zh-CN' || pref === 'en') return pref;
  return /^zh/i.test(uiLanguage || '') ? 'zh-CN' : 'en';
}
export const uiLanguage = (): string => (typeof chrome !== 'undefined' && chrome.i18n?.getUILanguage?.()) || (typeof navigator !== 'undefined' ? navigator.language : '') || 'en';

const zh = {
  // overlay
  tabOverview: '概览', tabChat: '对话', overview: '概览',
  resummarize: '重新总结', summarizing: '总结中…', summarizingLabel: '正在总结', updated: '已更新',
  minimize: '最小化', restore: '还原', clickToRestore: '点击还原', close: '关闭',
  resizeHandle: '拖动调整宽度，双击恢复默认',
  summaryFailed: (e: string) => `总结失败：${e}`, retry: '重试',
  summaryExpired: '总结已过期，请点击「重新总结」。',
  // chat
  emptyMain: '关于这个页面，随便问点什么。', emptySide: '这是一个空的支线会话。',
  slashHintPre: '输入 ', slashHintPost: ' 查看命令',
  current: (name: string) => `当前：${name}`,
  placeholderWait: '请先等待总结完成…', placeholder: '继续提问…（/ 查看命令）',
  inputLabel: '对话输入框', send: '发送',
  slashHeader: '命令 · ↑↓ 选择 · Tab/回车 确认', slashSide: '分叉出支线会话，可在后面接一句话作为第一条消息',
  runSkill: (name: string) => `运行 Skill：${name}（用输入框里的文字作为输入）`,
  mainSession: '主线', sideSession: (n: number) => `支线 ${n}`,
  mainSessionTitle: '主线会话', forkedFrom: (name: string) => `从「${name}」分叉`,
  closeSession: (name: string) => `关闭${name}`, forkTitle: '分叉出一个支线会话（也可以输入 /side）', newSide: '新支线',
  // options
  settingsTitle: 'Representer 设置', language: '界面语言', langAuto: '自动（跟随浏览器）',
  baseUrl: 'Base URL（OpenAI 兼容）', apiKey: 'API Key', model: 'Model',
  unknownError: '未知错误', testing: '测试中…', testConnection: '测试连接',
  testSending: (m: string) => `正在向 ${m} 发送测试请求…`,
  testOk: (ms: number, reply?: string) => `✓ 连接成功 · ${ms} ms${reply ? ` · 回复：${reply}` : ''}`,
  testFail: (e: string) => `✗ 连接失败：${e}`,
  mockMode: 'Mock 模式', mockAuto: '未填 Key → 自动启用', mockManual: '已手动开启',
  mockDesc: '不调用模型，返回模拟总结和逐字输出的模拟对话，用于预览界面。',
  mockAutoDesc: '当前没有填写 API Key，所以会自动使用 Mock；填写 Key 后可自由开关。',
  mockHint: '没有填写 API Key 时会自动使用（localhost 等本地地址除外）。',
  save: '保存', saved: '已保存 ✓',
  shortcutNow: '当前快捷键：', shortcutFallback: (k: string) => `${k}（页面内兜底）`,
  shortcutDesc: '默认 Mac 为 ⌘E、其他系统为 Ctrl+E，按一次显示、再按一次隐藏。',
  shortcutMissing: ' Chrome 没有分配该快捷键（可能与浏览器或其他扩展冲突），目前由页面内脚本兜底处理；在 chrome:// 等页面上不可用。',
  shortcutLink: '前往 chrome://extensions/shortcuts 自定义快捷键',
  modelPlaceholder: '选择或输入模型名，例如 gpt-4o-mini', refreshModels: '刷新模型列表', refresh: '刷新',
  modelsNeedConfig: '填写 Base URL 和 API Key 后会自动获取模型列表', modelsLoading: '正在获取模型列表…',
  modelsFailed: (e: string) => `获取模型列表失败：${e}`, modelsCount: (n: number) => `共 ${n} 个模型，可搜索，也可以直接输入自定义模型名`,
  loading: '加载中…', noModelMatch: (v: string) => `没有匹配的模型，回车后将使用自定义名称「${v}」`,
  connectFailed: (url: string, e: string) => `无法连接 ${url}：${e}`, notJson: '返回的不是 JSON',
  // skills manager
  skillsDesc: ['对话输入框上方的快捷指令。模板支持 ', '（输入框文字，留空时用页面选中文字）、', '、', '。'] as [string, string, string, string],
  newSkill: '＋ 新建', icon: '图标', name: '名称', namePlaceholder: '名称，例如：改写得更正式', template: '提示词模板',
  preview: '预览：', previewVars: { input: '（输入框文字）', selection: '（选中文字）', page_title: '（页面标题）' },
  saveChanges: '保存修改', add: '添加', cancel: '取消', noSkills: '还没有 Skill。', builtin: '内置',
  confirmDelete: '确定删除？', delete: '删除', moveUp: '上移', moveDown: '下移', edit: '编辑', resetSkills: '恢复内置默认 Skills',
  errName: '请填写名称', errNameLong: '名称最多 24 个字', errTemplate: '请填写提示词模板', errNoSkill: 'Skill 不存在',
  // mock
  mockPage: '这个页面',
  mockOverview: (t: string) => `这是「${t}」的模拟总结。文章先提出一个核心观点，再用具体例子解释背后的机制，最后给出可以落地的实践建议。开启 Mock 模式后，不需要真实模型和 API Key 也能完整预览 Representer 的界面流程。`,
  mockTerms: ['模拟总结', '核心观点', '实践建议', 'Mock 模式'],
  mockSections: [
    ['核心观点', ['点明页面要解决的主要问题', '说明这个问题为什么重要', '为后文的论证做铺垫']],
    ['工作原理', ['把机制拆成几个清晰的步骤', '每一步都配一个例子', '指出取舍和边界情况']],
    ['要点回顾', ['集中列出关键结论', '建议下一步可以尝试什么', '给出延伸阅读方向']],
  ] as [string, string[]][],
  mockReply: (q: string) => `（模拟回复）你问的是：「${q}」。\n\n根据总结，这个页面先提出核心观点，再一步步解释原理，最后在「要点回顾」里列出了下一步可以做什么。在设置页关闭 Mock 模式并填写 API Key，就能得到真实回答。`,
  // prompt
  replyLanguage: 'Simplified Chinese',
};
export type Messages = typeof zh;

const en: Messages = {
  tabOverview: 'Overview', tabChat: 'Chat', overview: 'Overview',
  resummarize: 'Re-summarize', summarizing: 'Summarizing…', summarizingLabel: 'Summarizing', updated: 'Updated',
  minimize: 'Minimize', restore: 'Restore', clickToRestore: 'Click to restore', close: 'Close',
  resizeHandle: 'Drag to resize, double-click to reset',
  summaryFailed: (e) => `Summary failed: ${e}`, retry: 'Retry',
  summaryExpired: 'The summary has expired. Click “Re-summarize”.',
  emptyMain: 'Ask anything about this page.', emptySide: 'This side chat is empty.',
  slashHintPre: 'Type ', slashHintPost: ' for commands',
  current: (name) => `Current: ${name}`,
  placeholderWait: 'Waiting for the summary…', placeholder: 'Ask a follow-up… (/ for commands)',
  inputLabel: 'Chat input', send: 'Send',
  slashHeader: 'Commands · ↑↓ to select · Tab/Enter to confirm', slashSide: 'Fork a side chat; add text after it to send as the first message',
  runSkill: (name) => `Run Skill: ${name} (uses the text in the input box)`,
  mainSession: 'Main', sideSession: (n) => `Side ${n}`,
  mainSessionTitle: 'Main chat', forkedFrom: (name) => `Forked from “${name}”`,
  closeSession: (name) => `Close ${name}`, forkTitle: 'Fork a side chat (or type /side)', newSide: 'New side',
  settingsTitle: 'Representer Settings', language: 'Language', langAuto: 'Auto (follow browser)',
  baseUrl: 'Base URL (OpenAI-compatible)', apiKey: 'API Key', model: 'Model',
  unknownError: 'Unknown error', testing: 'Testing…', testConnection: 'Test connection',
  testSending: (m) => `Sending a test request to ${m}…`,
  testOk: (ms, reply) => `✓ Connected · ${ms} ms${reply ? ` · Reply: ${reply}` : ''}`,
  testFail: (e) => `✗ Connection failed: ${e}`,
  mockMode: 'Mock mode', mockAuto: 'No key → on automatically', mockManual: 'Turned on manually',
  mockDesc: 'Skips the model and returns a sample summary and a streamed sample reply, for previewing the UI.',
  mockAutoDesc: 'No API key is set, so mock mode is used automatically. Add a key to toggle it freely.',
  mockHint: 'Used automatically when no API key is set (except for local addresses such as localhost).',
  save: 'Save', saved: 'Saved ✓',
  shortcutNow: 'Current shortcut: ', shortcutFallback: (k) => `${k} (in-page fallback)`,
  shortcutDesc: 'Default is ⌘E on Mac and Ctrl+E elsewhere. Press once to show, again to hide.',
  shortcutMissing: ' Chrome did not assign this shortcut (it may conflict with the browser or another extension), so an in-page script handles it instead; this does not work on chrome:// pages.',
  shortcutLink: 'Customize shortcuts at chrome://extensions/shortcuts',
  modelPlaceholder: 'Choose or type a model, e.g. gpt-4o-mini', refreshModels: 'Refresh model list', refresh: 'Refresh',
  modelsNeedConfig: 'Fill in the Base URL and API key to load the model list', modelsLoading: 'Loading models…',
  modelsFailed: (e) => `Couldn't load models: ${e}`, modelsCount: (n) => `${n} models. Search, or type a custom model name`,
  loading: 'Loading…', noModelMatch: (v) => `No matching model. Press Enter to use “${v}”`,
  connectFailed: (url, e) => `Couldn't connect to ${url}: ${e}`, notJson: 'The response is not JSON',
  skillsDesc: ['Quick prompts shown above the chat input. Templates support ', ' (the input text, or the page selection if empty), ', ', ', '.'],
  newSkill: '＋ New', icon: 'Icon', name: 'Name', namePlaceholder: 'Name, e.g. Make it more formal', template: 'Prompt template',
  preview: 'Preview: ', previewVars: { input: '(input text)', selection: '(selected text)', page_title: '(page title)' },
  saveChanges: 'Save changes', add: 'Add', cancel: 'Cancel', noSkills: 'No Skills yet.', builtin: 'Built-in',
  confirmDelete: 'Delete?', delete: 'Delete', moveUp: 'Move up', moveDown: 'Move down', edit: 'Edit', resetSkills: 'Restore built-in Skills',
  errName: 'Please enter a name', errNameLong: 'Names can be at most 24 characters', errTemplate: 'Please enter a prompt template', errNoSkill: 'Skill not found',
  mockPage: 'this page',
  mockOverview: (t) => `This is a sample summary of “${t}”. The article opens with a core idea, explains the mechanism behind it with concrete examples, and ends with practical advice. In mock mode you can preview the whole Representer experience without a real model or API key.`,
  mockTerms: ['sample summary', 'core idea', 'practical advice', 'mock mode'],
  mockSections: [
    ['Core idea', ['States the main problem the page tackles', 'Explains why the problem matters', 'Sets up the argument that follows']],
    ['How it works', ['Breaks the mechanism into clear steps', 'Pairs each step with an example', 'Points out trade-offs and edge cases']],
    ['Recap', ['Lists the key conclusions', 'Suggests what to try next', 'Points to further reading']],
  ],
  mockReply: (q) => `(Sample reply) You asked: “${q}”.\n\nAccording to the summary, the page first states a core idea, then explains how it works step by step, and ends with a recap of what to try next. Turn off mock mode and add an API key in settings to get real answers.`,
  replyLanguage: 'English',
};

const MESSAGES: Record<Lang, Messages> = { 'zh-CN': zh, en };
export const messages = (lang: Lang): Messages => MESSAGES[lang];
