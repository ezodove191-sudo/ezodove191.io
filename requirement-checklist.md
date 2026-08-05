# 需求清单 - 增量更新 #3

## 1. 去除编辑与交互功能（必须）

| # | 需求 | 类型 | 优先级 | 状态 |
|---|------|------|--------|------|
| 1.1 | 删除 `js/editor.js` 文件 | 删除 | 必须 | ✅ |
| 1.2 | 删除 `js/storage.js` 文件 | 删除 | 必须 | ✅ |
| 1.3 | 移除 `index.html` 中 editor.js 和 storage.js 的 `<script>` 引用 | 修改 | 必须 | ✅ |
| 1.4 | 移除侧边栏中「导出文章」「导入文章」「登录」「投稿」4 个按钮 | 修改 | 必须 | ✅ |
| 1.5 | 移除 `<input type="file" id="importFileInput">` 和 `<button class="fab-new" id="fabNew">` | 修改 | 必须 | ✅ |
| 1.6 | 移除 `app.js` 中 editor/submit/login/register 4 个路由分支及绑定函数调用 | 修改 | 必须 | ✅ |
| 1.7 | 移除 `app.js` 中 `bindCardActions()` 函数内容（保留空函数避免调用报错） | 修改 | 必须 | ✅ |
| 1.8 | 移除 `app.js` 中 `bindEditorBackLink()` 函数 | 修改 | 必须 | ✅ |
| 1.9 | 在 `app.js` 中添加简化版数据函数（直接返回静态数组） | 新增 | 必须 | ✅ |
| 1.10 | 移除 `effects.js` 中 `initEditor()` 调用 | 修改 | 必须 | ✅ |
| 1.11 | 移除 `pages.js` 中 submit/login/register 相关函数 | 修改 | 必须 | ✅ |
| 1.12 | 更新 `pages.js` 中 `renderStatsPage()` 移除 `getCustomData()` 引用 | 修改 | 必须 | ✅ |
| 1.13 | 移除列表卡片中 `_custom` 标记和编辑/删除按钮 HTML | 修改 | 必须 | ✅ |

## 2. 全面安全加固（必须）

| # | 需求 | 类型 | 优先级 | 状态 |
|---|------|------|--------|------|
| 2.1 | 添加 CSP `<meta>` 标签（限制 script/style/img/connect 来源） | 新增 | 必须 | ✅ |
| 2.2 | 添加 `X-Content-Type-Options: nosniff` meta 标签 | 新增 | 必须 | ✅ |
| 2.3 | 添加 `referrer` meta 标签控制引用来源泄露 | 新增 | 必须 | ✅ |
| 2.4 | 在 `getRoute()` 中添加路由白名单校验，拒绝非法页面名 | 修改 | 必须 | ✅ |
| 2.5 | 搜索输入框添加 `maxlength` 属性限制输入长度 | 修改 | 必须 | ✅ |
| 2.6 | 审计所有 `innerHTML` 赋值点，确保动态内容经 `escapeHtml()` 转义 | 修改 | 必须 | ✅ |

## 3. 开场动画 + 加载界面重设计（必须）

| # | 需求 | 类型 | 优先级 | 状态 |
|---|------|------|--------|------|
| 3.1 | 合并开场动画和加载界面为统一流程（总时长 5-6 秒） | 修改 | 必须 | ✅ |
| 3.2 | 开场阶段（~3s）：精简 SVG 图标组装 + 标题淡入，仅用 transform/opacity | 修改 | 必须 | ✅ |
| 3.3 | 加载阶段（~2-3s）：主题化卡片风格（品牌图标 + 进度条 + 状态文字） | 修改 | 必须 | ✅ |
| 3.4 | 配色从绿色终端风改为网站主题金/琥珀色 | 修改 | 必须 | ✅ |
| 3.5 | 背景从纯黑改为网站深蓝背景 | 修改 | 必须 | ✅ |
| 3.6 | 移除旧 splash CSS（pages.css）和旧 loading CSS（components.css） | 删除 | 必须 | ✅ |
| 3.7 | 移除旧 splash/loading JS 逻辑（effects.js），替换为新统一流程 | 修改 | 必须 | ✅ |
| 3.8 | 移除 `index.html` 中旧 splash/loading HTML，替换为新统一结构 | 修改 | 必须 | ✅ |
| 3.9 | 仅用 transform + opacity 动画，移除 blur/clip-path/drop-shadow 等高开销属性 | 修改 | 必须 | ✅ |
| 3.10 | sessionStorage 控制仅首次访问播放 | 修改 | 必须 | ✅ |
