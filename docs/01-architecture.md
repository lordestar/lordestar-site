# 架构与目录说明

> 2026-02 更新：M1 起站点从纯静态迁移为 **SSR + D1 数据库**（Cloudflare Workers），内容由 `src/content/` 迁入 D1 的 `works` / `posts` 表；本地开发在无 D1 时回退内容集合。

## 1. 系统总览

```text
GitHub 仓库
  │  push main
  ▼
GitHub Actions ──► pnpm install --frozen-lockfile
  │                 pnpm check
  │                 pnpm build
  │                 wrangler d1 migrations apply --remote
  ▼                 wrangler deploy --config dist/server/wrangler.json
Cloudflare Workers ──► ASSETS 静态资源（dist/client）
  │                    + D1 数据库（works/posts）
  │                    + KV（SESSION）/ Images（IMAGES）
```

全部页面按需渲染（SSR）；关于页在构建时预渲染（`node:fs` 扫描照片）。内容实时读 D1，编辑后无需重新构建。

## 2. 技术选型

| 模块     | 选型                                      | 职责                            |
| -------- | ----------------------------------------- | ------------------------------- |
| 静态框架 | Astro 7（SSR，`output: 'server'`）        | 页面路由、布局、按需渲染、构建  |
| 运行时   | Cloudflare Workers（@astrojs/cloudflare） | 服务器端渲染 + ASSETS 静态资源  |
| 数据库   | Cloudflare D1（SQLite）                   | works/posts 内容存储            |
| UI 交互  | React 19 + `@astrojs/react`               | 粒子 Hero、液态作品卡片等交互岛 |
| 样式     | Tailwind CSS 4 + 自定义 CSS 变量          | 全局主题、玻璃拟态、响应式      |
| 后台     | 自建表单页（M2，替换 Decap CMS）          | `/admin` 可视化编辑，写 D1      |
| 部署     | Cloudflare Workers + GitHub Actions       | 自动构建、迁移、部署            |
| 包管理   | pnpm 11                                   | 依赖与锁文件                    |

## 3. 目录结构

```text
.
├── .github/workflows/       # CI 与部署流水线
├── docs/                    # 开发文档
├── functions/admin/oauth/   # （已退役）Pages Functions GitHub OAuth，M1 后不再部署
├── migrations/              # D1 迁移 SQL（0001_init.sql 建 works/posts 表）
├── oauth-worker/            # （已退役）独立 Worker 备用方案
├── public/
│   ├── admin/               # Decap CMS 页面与配置源文件（M2 将移除）
│   ├── photos/              # 关于页占位图片
│   └── _headers             # 安全与缓存头
├── scripts/                 # 工程脚本（含 migrate-content.mjs 内容迁移）
├── src/
│   ├── components/          # 页面组件与交互岛
│   │   ├── image-galaxy/    # 照片墙漂移引擎（纯 TS）
│   │   ├── liquid/          # 液态卡片 SDF 引擎（纯 TS/TSX）
│   │   └── originkit/       # Originkit 生成的组件
│   ├── content/             # 作品与随想的双语 Markdown（迁移源，dev 兜底）
│   ├── layouts/             # 基础布局
│   ├── lib/data.ts          # 数据访问层：D1 查询 + 内容集合兜底
│   ├── pages/               # Astro 路由（SSR）
│   ├── styles/              # 全局样式
│   ├── content.config.ts    # 内容集合 Schema（dev 兜底用）
│   ├── env.d.ts             # Cloudflare 绑定类型（Cloudflare.Env）
│   └── i18n.ts              # 双语文案与工具函数
├── astro.config.mjs         # SSR + cloudflare adapter + 预渲染配置
├── wrangler.toml            # Worker 配置（D1 绑定）
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

## 7. 后台与 OAuth（迁移后状态）

- **M1 后**：内容存于 D1，Decap CMS（git 工作流）与 `functions/admin/oauth`（GitHub OAuth）已退役，不再部署；
- **M2 已完成**：自建后台（`/admin` 密码登录 + 作品/文章 CRUD + KV 媒体上传）；登录后续（M4）可升级 Cloudflare Access 邮箱验证码；
- `public/admin/config.{local,prod}.yml` 与 `scripts/copy-admin.mjs` 已随 M2 移除。

## 8. 生成物规则

以下文件由脚本生成，不应提交：

- `public/admin/decap-cms.js`：从 `node_modules/decap-cms` 复制
- `public/admin/config.yml`：从 local/prod 配置复制
- `public/uploads/`：本地媒体上传目录
- `dist/`、`.astro/`、日志、`.originkit/`

规则已写入 `.gitignore`。
