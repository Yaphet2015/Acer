# Acer
Open-source AI reading companion for Chrome.

## 中文说明

Acer 是一个开源的 Chrome 插件（Manifest V3），提供「AI 总结 + 大纲树（思维导图）+ 继续对话」体验，后端使用 BYOK（自带 OpenAI 兼容 API Key），数据全部保存在浏览器本地。

### 功能
- **快捷键唤起浮层**：默认 Mac `⌘E`、Windows/Linux `Ctrl+E`，按一次显示、再按一次隐藏；可在 `chrome://extensions/shortcuts` 自定义（设置页有直达链接）；点击工具栏图标也可切换。
  - 若 Chrome 因冲突没有分配该快捷键（`chrome://extensions/shortcuts` 里显示为空），内容脚本会在页面内兜底监听 `⌘E` / `Ctrl+E`；兜底只在普通网页生效，`chrome://` 页面和 Chrome 应用商店不可用。注意 Mac 上 `⌘E` 原本是「用所选内容查找」，扩展快捷键会覆盖它；Chrome 只在首次安装时应用建议快捷键，已安装的用户需要手动修改。
  - 实测（Linux 上的 Chrome 154）：Chrome 不接受 `Ctrl+E` 作为建议快捷键（它是浏览器自带的“聚焦搜索”快捷键，安装后显示为未设置；`Alt+Shift+M`、`Ctrl+Shift+E` 都能正常分配），所以默认走页面内兜底。Mac 上的 `⌘E` 没有实测。
- **AI 总结 + 大纲树**：用 [defuddle](https://github.com/kepano/defuddle) 提取正文（Markdown），交给 LLM 生成结构化 JSON（Overview、关键词高亮、分节大纲）。
- **继续对话**：Chat 标签页基于总结和正文继续提问，回复逐字流式输出，对话按页面保存。
- **可调宽度**：拖动浮层左边缘调整宽度（320–640px，且不超过窗口宽度减 40px），宽度会被记住；双击左边缘恢复默认 380px。
- **支线会话 `/side`**：在对话框输入 `/side`（可以在后面接一句话）会把当前会话连同页面和总结上下文复制成一个新的支线，之后两边各自独立发展。会话以小标签显示在对话页顶部（主线、支线 1、支线 2…），可切换、可关闭，按页面保存。输入 `/` 会弹出命令提示。
- **自定义 Skills**：在设置页增删改、排序 Skill（名称、图标、提示词模板，模板支持 `{{input}}`、`{{selection}}`、`{{page_title}}`），自带「翻译成英文」「提炼要点」「解释概念」「出几道题」。对话框上方会按最近使用顺序显示 Skill 按钮（横向滚动，滚轮也可横向滚动），点击后用输入框里的文字（为空时用页面选中的文字）在当前会话里运行。
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
- **Model**：填好 Base URL 和 Key 后会自动从 `/models` 拉取模型列表（可搜索，也可直接输入自定义模型名，点「刷新」可重新获取）
- **测试连接**：向所选模型发一条极短的请求，显示是否成功及耗时

- **Mock mode**：勾选后不调用模型，约 1.2 秒后返回一份模拟总结，对话也会逐字输出模拟回复，方便不填 Key 先体验完整界面。没填 API Key 时也会自动进入 Mock mode（`localhost` 等本地地址除外）。

所有请求都经后台 Service Worker 直接发往你配置的接口，不经过任何第三方服务器。模型调用基于 [pi durable](https://github.com/earendil-works/pi)（`@earendil-works/pi-durable` + `@earendil-works/pi-ai`），走 OpenAI 兼容的 `/chat/completions` 接口。

### 技术栈
WXT · React · TypeScript · Tailwind CSS · Framer Motion · pi durable (pi-ai) · zod · Shadow DOM 渲染浮层

### 致谢
部分 UI 组件（Button、Shimmer、LoadingState、对话输入框和气泡样式、流式光标、设计 token）改编自 [Beautiful UI](https://www.beautifului.dev)（MIT License），源码在 `components/bui/` 和 `assets/beautifui.css`。
