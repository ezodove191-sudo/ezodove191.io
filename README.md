# 精神病院 · 内部档案系统

> Internal Records System v2.4.0

## 快速开始

直接用浏览器打开 `index.html` 即可运行，无需安装任何依赖。

## 项目结构

```
website/
├── index.html                  # 主入口文件
├── css/                        # 样式文件
│   ├── base.css                # 重置、CSS变量、基础样式、响应式
│   ├── layout.css              # 导航栏、页脚、搜索栏布局
│   ├── components.css          # 卡片、Hero、详情页等组件
│   ├── pages.css               # 关于页、院长页、站长页等专属样式
│   ├── themes.css              # 明暗主题切换
│   ├── new-pages.css           # 新增页面（地图、统计、表单等）样式
│   └── animations.css          # 增强动效与微交互
├── js/                         # JavaScript 模块
│   ├── app.js                  # 路由、渲染、搜索、名称交叉链接
│   ├── pages.js                # 新增页面渲染（地图、统计、投稿、登录等）
│   ├── editor.js               # 文章编辑器
│   ├── effects.js              # Canvas特效、加载动画、移动端菜单
│   ├── storage.js              # localStorage 数据层
│   ├── theme.js                # 明暗主题切换
│   ├── filter.js               # 高级筛选过滤
│   ├── relation-graph.js       # 角色关系图谱
│   └── shortcuts.js            # 键盘快捷键
├── data/                       # 数据文件
│   ├── characters.js           # 角色数据
│   ├── departments.js          # 部门数据
│   ├── rulebooks.js            # 规则数据
│   ├── contaminants.js         # 污染物数据
│   ├── stories.js              # 故事数据
│   ├── categories.js           # 首页分类数据
│   └── svg-icons.js            # SVG 图标
└── assets/
    └── images/                 # 图片资源（见下方说明）
```

## 图片放置指南

所有图片放在 `assets/images/` 目录下，按用途分子目录存放。以下是各目录说明和命名规范。

### 目录结构

```
assets/images/
├── characters/       # 角色头像/立绘
├── departments/      # 部门标志/图片
├── contaminants/     # 污染物相关图片
├── stories/          # 故事配图
├── map/              # 病院地图/楼层平面图
├── submissions/      # 用户投稿图片
├── icons/            # 自定义图标
└── background/       # 背景图片
```

### 命名规范

#### 角色头像 (`assets/images/characters/`)

使用角色的 `id` 作为文件名，支持 `.png`、`.jpg`、`.webp` 格式。

| 角色 ID | 文件名 | 说明 |
|---------|--------|------|
| yu-sheng | `yu-sheng.png` | 榆笙的头像 |
| feng-ye | `feng-ye.jpg` | 枫夜的头像 |
| mo-mo | `mo-mo.png` | 墨墨的头像 |
| en-zhi | `en-zhi.png` | 蒽芷的头像 |

> 命名规则：全小写，单词间用连字符 `-` 连接，与 `data/characters.js` 中的 `id` 字段保持一致。

#### 部门图片 (`assets/images/departments/`)

使用部门的 `id` 作为文件名。

| 部门 ID | 文件名 | 说明 |
|---------|--------|------|
| finance | `finance.png` | 财政部标志 |
| maintenance | `maintenance.png` | 维修部标志 |
| security | `security.png` | 安全部标志 |
| medical | `medical.png` | 医疗部标志 |
| legal | `legal.png` | 法务部标志 |
| design | `design.png` | 设计部标志 |
| hr | `hr.png` | 人资部标志 |
| procurement | `procurement.png` | 采购部标志 |
| kitchen | `kitchen.png` | 后厨标志 |
| research | `research.png` | 科研部标志 |

#### 病院地图 (`assets/images/map/`)

按楼层命名，使用 `floor-` 前缀。

| 文件名 | 说明 |
|--------|------|
| `floor-b1.png` | B1 地下层平面图 |
| `floor-1f.png` | 一层平面图 |
| `floor-2f.png` | 二层平面图 |
| `floor-3f.png` | 三层平面图 |
| `floor-4f.png` | 四层平面图 |
| `floor-rf.png` | 天台平面图 |
| `overview.png` | 病院全景图（可选） |

#### 污染物图片 (`assets/images/contaminants/`)

使用污染物的 `id` 作为文件名。

| 污染物 ID | 文件名 | 说明 |
|-----------|--------|------|
| cont-0-01 | `cont-0-01.png` | 镜像 |
| cont-0-02 | `cont-0-02.png` | 奥林匹斯之巅 |
| cont-1-01 | `cont-1-01.png` | Level 1 污染物 |

#### 故事配图 (`assets/images/stories/`)

使用故事的序号或 `id` 作为文件名。

| 文件名 | 说明 |
|--------|------|
| `001.png` | 第 1 篇故事配图 |
| `002.png` | 第 2 篇故事配图 |

#### 投稿图片 (`assets/images/submissions/`)

用户投稿时填写的文件名对应此目录。

| 文件名 | 说明 |
|--------|------|
| `my-character.png` | 用户自定义角色图片 |
| `my-story.jpg` | 用户自定义故事配图 |

#### 背景图片 (`assets/images/background/`)

| 文件名 | 说明 |
|--------|------|
| `bg-main.png` | 主背景纹理（可选，替换 CSS 渐变背景） |
| `bg-hero.png` | Hero 区域背景图（可选） |

### 图片格式建议

| 用途 | 推荐格式 | 建议尺寸 | 最大文件 |
|------|----------|----------|----------|
| 角色头像 | PNG / WebP | 400×400 px | 200 KB |
| 部门标志 | SVG / PNG | 120×120 px | 50 KB |
| 楼层地图 | PNG / WebP | 1200×800 px | 500 KB |
| 故事配图 | JPEG / WebP | 800×600 px | 300 KB |
| 背景图片 | WebP | 1920×1080 px | 500 KB |

### 如何在代码中引用图片

在 `data/characters.js` 等数据文件中，可以为角色/部门等添加 `image` 字段：

```javascript
{
  id: 'yu-sheng',
  name: '榆笙',
  image: 'yu-sheng.png',  // 对应 assets/images/characters/yu-sheng.png
  // ...其他字段
}
```

在渲染代码中通过以下路径访问：

```javascript
const imgPath = `assets/images/characters/${char.image}`;
```

### 注意事项

1. **使用相对路径**：所有图片引用使用相对路径（`assets/images/...`），确保离线可用。
2. **压缩图片**：上传前请压缩图片，建议使用 TinyPNG 或 Squoosh。
3. **格式优先级**：WebP > PNG > JPEG > GIF。
4. **占位图**：未放置图片时，系统会显示文字占位，不影响功能。
5. **中文文件名**：避免使用中文命名，统一使用英文和连字符。

## 键盘快捷键

| 快捷键 | 功能 |
|--------|------|
| `/` | 聚焦搜索框 |
| `Esc` | 返回 / 失焦搜索 |
| `t` | 切换明暗主题 |
| `?` | 显示快捷键帮助 |
| `g h` | 回到主页 |
| `g c` | 人设页 |
| `g r` | 守则页 |
| `g d` | 部门页 |
| `g s` | 故事页 |
| `g m` | 地图页 |
| `g t` | 统计面板 |

## 浏览器兼容

支持所有现代浏览器：Chrome 90+、Firefox 88+、Safari 14+、Edge 90+。

## 版本

v2.4.0 — 从单文件 HTML 拆分为多文件项目，新增地图、统计、投稿、登录、关系图谱等页面和功能。
