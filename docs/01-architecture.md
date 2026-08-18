# 架构与目录说明

## 1. 系统总览

```text
GitHub 仓库
  │  push main
  ▼
GitHub Actions ──► pnpm install --frozen-lockfile
  │                 pnpm check
  ▼                 pnpm build
Cloudflare Pages ──► dist/ 静态站点 + functions/ 后台登录
```

构建产物是纯静态 HTML/CSS/JS。只有 `/admin/oauth/*` 由 Cloudflare Pages Functions 提供运行时能力，用于 Decap CMS 的 GitHub OAuth。

## 2. 技术选型

| 模块     | 选型                                 | 职责                            |
| -------- | ------------------------------------ | ------------------------------- |
| 静态框架 | Astro 7                              | 页面路由、布局、内容集合、构建  |
| UI 交互  | React 19 + `@astrojs/react`          | 粒子 Hero、液态作品卡片等交互岛 |
| 样式     | Tailwind CSS 4 + 自定义 CSS 变量     | 全局主题、玻璃拟态、响应式      |
| 内容     | Astro Content Collections + Markdown | 作品、随想的双语内容            |
| 后台     | Decap CMS                            | `/admin` 可视化编辑             |
| 部署     | Cloudflare Pages + GitHub Actions    | 自动构建、托管、Functions       |
| 包管理   | pnpm 11                              | 依赖与锁文件                    |

## 3. 目录结构

```text
.
├── .github/workflows/       # CI 与部署流水线
├── docs/                    # 开发文档
├── functions/admin/oauth/   # Pages Functions：GitHub OAuth
├── oauth-worker/            # 同逻辑的独立 Worker 备用方案
├── public/
│   ├── admin/               # Decap CMS 页面与配置源文件
│   ├── photos/              # 关于页占位图片
│   └── _headers             # 安全与缓存头
├── scripts/                 # 工程脚本
├── src/
│   ├── components/          # 页面组件与交互岛
│   │   ├── image-galaxy/    # 照片墙漂移引擎（纯 TS）
│   │   ├── liquid/          # 液态卡片 SDF 引擎（纯 TS/TSX）
│   │   └── originkit/       # Originkit 生成的组件
│   ├── content/             # 作品与随想的双语 Markdown
│   ├── layouts/             # 基础布局
│   ├── pages/               # Astro 路由
│   ├── styles/              # 全局样式
│   ├── content.config.ts    # 内容集合 Schema
│   └── i18n.ts              # 双语文案与工具函数
├── astro.config.mjs
├── package.json
└── pnpm-workspace.yaml
```

## 4. 路由与国际化

- 默认语言中文：`/`、`/about/`、`/works/`、`/thoughts/`
- 英文前缀：`/en/`、`/en/about/`、`/en/works/`、`/en/thoughts/`
- 文章详情：`/thoughts/:slug/` 与 `/en/thoughts/:slug/`
- 作品详情：`/works/:slug/` 与 `/en/works/:slug/`
- 404 页面：`src/pages/404.astro`

文案统一放在 `src/i18n.ts` 的 `ui.zh` / `ui.en` 中，页面组件通过 `ui[locale]` 取文案，禁止把界面文案硬编码进组件。

## 5. 内容模型

两个集合由 `src/content.config.ts` 定义：

| 集合    | 目录                         | 关键字段                                                                         |
| ------- | ---------------------------- | -------------------------------------------------------------------------------- |
| `works` | `src/content/works/{zh,en}/` | `title`、`type`、`date`、`summary`、`tags`、`link`、`audio`、`cover`、`featured` |
| `posts` | `src/content/posts/{zh,en}/` | `title`、`date`、`summary`、`tags`                                               |

文件 id 形如 `zh/ambient-drift` / `en/ambient-drift`，由 `i18n.ts` 中的 `localeFromId()`、`entriesFor()`、`slugFromId()` 统一处理。

## 6. 交互视觉组件

| 组件                                                  | 用途                | 当前状态                              |
| ----------------------------------------------------- | ------------------- | ------------------------------------- |
| `PixelDriftStage.tsx` + `originkit/ui/pixeldrift.tsx` | 首页粒子文字 Hero   | 可用                                  |
| `DotCutHero.astro`                                    | 作品页点阵动画 Hero | WIP，内联脚本暂用 `@ts-nocheck`       |
| `FeaturedWorks.tsx` + `liquid/`                       | 作品页液态卡片      | 可用，纯 TS 引擎                      |
| `PhotoGalaxy.astro`                                   | 关于页照片墙        | 可用，引擎见 `image-galaxy/engine.ts` |
| `WorkDetailPage.astro`                                | 作品详情页          | 可用，正文/封面/音频/外链             |
| `MusicVisualizer.astro`                               | 音频可视化播放器    | 可用，内联脚本暂用 `@ts-nocheck`      |

新交互组件应优先写成独立 TS/TSX 模块（参考 `src/components/liquid/` 与 `image-galaxy/`），避免大型内联脚本。

## 7. 后台与 OAuth

- `public/admin/config.local.yml`：本地文件系统后台
- `public/admin/config.prod.yml`：线上 GitHub 后台
- `scripts/copy-admin.mjs` 在 `dev` / `build` 时复制生成 `public/admin/config.yml`
- `functions/admin/oauth/auth.js` 与 `callback.js` 实现 GitHub OAuth
- `oauth-worker/` 是同一逻辑的独立 Worker 版本，保留备用

## 8. 生成物规则

以下文件由脚本生成，不应提交：

- `public/admin/decap-cms.js`：从 `node_modules/decap-cms` 复制
- `public/admin/config.yml`：从 local/prod 配置复制
- `public/uploads/`：本地媒体上传目录
- `dist/`、`.astro/`、日志、`.originkit/`

规则已写入 `.gitignore`。
