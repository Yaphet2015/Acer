# open-mind-extension
Open-source browser extension inspired by YouMind's Chrome extension (clean-room reimplementation)

## 中文说明

Open Mind 是一个开源的 Chrome 插件（Manifest V3），复刻 YouMind 插件的「AI 总结 + 大纲树（思维导图）+ 继续对话」体验，后端使用 BYOK（自带 OpenAI 兼容 API Key），数据全部保存在浏览器本地。

### 功能
- **快捷键唤起浮层**：默认 `Alt+Shift+M`，可在 `chrome://extensions/shortcuts` 自定义（设置页有直达链接）；点击工具栏图标也可切换。
- **AI 总结 + 大纲树**：用 [defuddle](https://github.com/kepano/defuddle) 提取正文（Markdown），交给 LLM 生成结构化 JSON（Overview、关键词高亮、分节大纲）。
- **继续对话**：Chat 标签页基于总结和正文继续提问，回复逐字流式输出，对话按页面保存。
- **24 小时缓存**：同一 URL（去掉 hash 和 utm 等追踪参数）24 小时内再次打开直接读缓存；点「Re-summarize」强制重新总结（会清空该页对话）。

### 安装与开发
```bash
npm install
npm run dev      # 开发模式，自动打开带插件的 Chrome
npm run build    # 产物在 .output/chrome-mv3
npm test         # Vitest 单元测试
```
手动加载：打开 `chrome://extensions`，开启「开发者模式」，点「加载已解压的扩展程序」，选择 `.output/chrome-mv3`。

### 配置
打开插件的「选项」页，填写：
- **Base URL**：OpenAI 兼容接口地址，例如 `https://api.openai.com/v1`、`https://openrouter.ai/api/v1`，或本地 Ollama `http://localhost:11434/v1`（本地地址可不填 Key）
- **API Key**
- **Model**：例如 `gpt-4o-mini`

- **Mock mode**：勾选后不调用模型，约 1.2 秒后返回一份模拟总结，对话也会逐字输出模拟回复，方便不填 Key 先体验完整界面。没填 API Key 时也会自动进入 Mock mode（`localhost` 等本地地址除外）。

所有请求都经后台 Service Worker 直接发往你配置的接口，不经过任何第三方服务器。模型调用基于 [pi durable](https://github.com/earendil-works/pi)（`@earendil-works/pi-durable` + `@earendil-works/pi-ai`），走 OpenAI 兼容的 `/chat/completions` 接口。

### 技术栈
WXT · React · TypeScript · Tailwind CSS · Framer Motion · pi durable (pi-ai) · zod · Shadow DOM 渲染浮层
