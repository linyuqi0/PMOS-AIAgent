# PMOS Lite - AI产品经理工作台

> 完全免费、本地优先、可部署到 GitHub Pages 的 AI 产品经理工具箱

## 简介

PMOS Lite 是一款专为产品经理、运营、BI 分析师打造的轻量级工作台。所有数据存储在浏览器本地（IndexedDB），无需服务器、无需数据库、无需付费服务，开箱即用。

## ✨ 核心特性

- 🔒 **完全本地化** - 数据存储在 IndexedDB，不上传任何服务器
- 🆓 **100% 免费** - 无付费依赖，纯开源技术栈
- 📦 **即开即用** - 部署到 GitHub Pages 即可使用
- 🎨 **精美 UI** - 莫兰迪配色，深浅模式，极简高级感
- 📱 **PWA 支持** - 可安装到桌面，离线可用
- 💾 **数据安全** - 支持导入导出，数据自己掌控

## 🚀 功能模块

### 1. 工作台 Dashboard
- 项目数、PRD数、知识库数、Prompt数统计
- 最近编辑记录
- 快速入口卡片

### 2. 项目中心
- 项目创建、编辑、删除、归档
- 项目标签管理
- 项目搜索筛选

### 3. PRD生成器
- 9大标准PRD模块（背景、目标、用户故事、业务流程、功能设计、异常流程、埋点、验收标准、测试建议）
- Markdown 编辑与实时预览
- 导出 Markdown / HTML
- 一键生成模板

### 4. 需求分析器
- 需求拆解
- 风险分析
- 开发评估
- 测试评估
- 上线风险评估

### 5. SQL助手
- MySQL / Hive / ClickHouse / StarRocks 多方言支持
- SQL 格式化
- 自然语言转 SQL
- SQL 收藏管理
- 内置模板库

### 6. 埋点设计器
- 事件与属性管理
- 属性字典总览
- 自动生成埋点文档
- 导出 Markdown

### 7. 测试用例生成器
- 5大用例类型：正常流程、异常流程、边界场景、权限场景、兼容场景
- 一键批量生成
- 优先级管理
- 导出测试用例文档

### 8. 知识库
- 支持 TXT、Markdown、PDF、DOCX、XLSX 上传
- 全文搜索
- 标签管理
- 本地存储

### 9. Prompt库
- 9大分类内置 Prompt 模板
- 收藏管理
- 一键复制
- 自定义标签

## 🛠️ 技术栈

| 技术 | 用途 |
|------|------|
| Next.js 14 | 前端框架（静态导出） |
| React 18 | UI 库 |
| TypeScript | 类型安全 |
| TailwindCSS | 样式方案 |
| Shadcn UI 风格 | 组件库 |
| Framer Motion | 动画 |
| Lucide Icons | 图标 |
| Dexie.js | IndexedDB 封装 |
| Zustand | 状态管理 |
| next-themes | 主题切换 |
| PWA | 离线支持 |

## 📦 快速开始

### 本地开发

```bash
# 安装依赖
npm install

# 启动开发服务器
npm run dev

# 构建生产版本
npm run build
```

构建产物在 `out/` 目录下，为纯静态文件。

## 🚀 部署到 GitHub Pages

### 方式一：GitHub Actions 自动部署（推荐）

1. 在 GitHub 创建新仓库，将代码推送到 `main` 分支
2. 打开仓库设置：`Settings → Pages`
3. 在 **Build and deployment** 中选择 **Source: GitHub Actions**
4. 代码中已包含 `.github/workflows/deploy.yml`，推送代码后会自动构建部署
5. 部署完成后，访问地址为：`https://<username>.github.io/<repo-name>/`

> 注意：如果你的仓库名不是 `pmos-lite`，请修改 `next.config.js` 中的 `repoName` 变量为你的仓库名。

### 方式二：手动部署

```bash
# 构建
npm run build

# 将 out/ 目录的内容推送到 gh-pages 分支
```

## 📁 项目结构

```
pmos-lite/
├── app/                      # Next.js App Router
│   ├── dashboard/            # 工作台
│   ├── projects/             # 项目中心
│   ├── prd/                  # PRD生成器
│   ├── analyzer/             # 需求分析器
│   ├── sql/                  # SQL助手
│   ├── tracking/             # 埋点设计器
│   ├── test-cases/           # 测试用例生成器
│   ├── knowledge/            # 知识库
│   ├── prompts/              # Prompt库
│   ├── settings/             # 设置
│   ├── layout.tsx            # 根布局
│   ├── page.tsx              # 首页（重定向）
│   └── globals.css           # 全局样式
├── components/               # React 组件
│   ├── ui/                   # 基础 UI 组件
│   ├── layout/               # 布局组件
│   └── theme-provider.tsx    # 主题
├── lib/                      # 工具库
│   ├── db.ts                 # Dexie/IndexedDB
│   └── utils.ts              # 工具函数
├── store/                    # 状态管理 (Zustand)
├── types/                    # TypeScript 类型
├── public/                   # 静态资源
│   ├── icons/                # PWA 图标
│   ├── manifest.json         # PWA 清单
│   └── sw.js                 # Service Worker
├── .github/workflows/        # CI/CD
│   └── deploy.yml            # GitHub Pages 部署
├── package.json
├── next.config.js
├── tailwind.config.js
└── tsconfig.json
```

## 💾 数据管理

所有数据保存在浏览器的 IndexedDB 中。

### 数据备份

进入「设置 → 数据管理 → 导出备份」，下载 JSON 格式的备份文件。

### 数据恢复

进入「设置 → 数据管理 → 导入备份」，选择之前的备份文件，数据将合并到现有数据中。

### 清空数据

进入「设置 → 数据管理 → 清空所有」，将删除所有本地数据。此操作不可恢复，请谨慎操作。

## 🎨 主题

支持浅色模式、深色模式、跟随系统三种主题。点击右上角主题切换按钮即可切换。

## 📱 PWA

使用 Chrome / Edge / Safari 浏览器访问时，可将应用安装到桌面，获得类似原生应用的体验。支持离线使用。

## 🔒 隐私

- 所有数据存储在本地浏览器中
- 不收集任何用户数据
- 不向任何服务器发送数据
- 数据安全由你自己掌控

## 📄 License

MIT License

---

> 💡 **提示**：这是一款纯前端工具，所有数据存储在浏览器本地。清除浏览器数据会导致数据丢失，请定期导出备份。
