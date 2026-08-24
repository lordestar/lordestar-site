# lordestar

lordestar 的个人网站：音乐作品、代码作品、经历与随想。**主域名：https://lordestar.cn**

技术栈：Astro 7 SSR + React 交互岛 + Tailwind CSS 4 + Cloudflare Workers + D1 + GitHub 媒体库 + PWA，中英双语，默认中文。

## 快速开始

```bash
pnpm install
pnpm dev
```

打开 `http://localhost:4321`。中文为默认语言，英文在 `/en/`。

手机 App（PWA 记录）：「记一笔」悬浮按钮或 `/app/new/`，支持粘贴网易云链接记歌、写感想、传照片；`/app/records/` 管理记录（编辑/删除/公开开关）。已配置 Web Share Target——安卓任意 App 分享内容可直接投递到记一笔。

本地后台（编辑作品/文章）：

```bash
pnpm db:local   # 首次：给本地 D1 建表并导入内容
pnpm dev
```

然后打开 `http://localhost:4321/admin`，用 `.dev.vars` 里的 `ADMIN_PASSWORD` 登录。线上后台：`https://lordestar.pages.dev/admin`。

## 常用命令

| 命令                | 说明                                      |
| ------------------- | ----------------------------------------- |
| `pnpm dev`          | 启动 Astro 开发服务器                     |
| `pnpm build`        | 构建站点（`dist/client` + `dist/server`） |
| `pnpm preview`      | 本地预览构建产物                          |
| `pnpm check`        | Astro + TypeScript 类型检查               |
| `pnpm format`       | 用 Prettier 格式化全部代码                |
| `pnpm format:check` | 检查格式是否符合规范                      |
| `pnpm clean`        | 清理 `dist/` 与 `.astro/`                 |
| `pnpm db:local`     | 本地 D1 建表 + 导入内容                   |
| `pnpm db:seed`      | 把 `src/content/` 的 Markdown 导入线上 D1 |
| `pnpm ci`           | 本地跑一遍完整质量门禁                    |

## 项目状态

项目已上线部署（`https://lordestar.pages.dev`），当前处于上线后的迭代开发阶段。页面骨架、双语路由、内容集合、CMS 后台、Cloudflare 部署和大部分视觉交互已经可用；作品详情页、RSS、Sitemap、测试体系等仍在路线图中。

当前进度和后续计划见 [docs/06-roadmap.md](docs/06-roadmap.md)。

## 文档导航

- [开发文档总览](docs/README.md)
- [架构与目录说明](docs/01-architecture.md)
- [本地开发指南](docs/02-development.md)
- [内容与 CMS 管理](docs/03-content-management.md)
- [部署与 CI/CD](docs/04-deployment.md)
- [工程开发规范](docs/05-engineering-standards.md)
- [开发路线图](docs/06-roadmap.md)

## 内容管理

- 后台地址：`/admin`（密码登录，会话 7 天）
- 线上：`https://lordestar.pages.dev/admin`
- 本地：`pnpm dev` + 打开 `/admin`（`.dev.vars` 里的 `ADMIN_PASSWORD`）
- 内容存于 D1 数据库（works/posts 表），编辑后前台即时生效
- 站点文案：`src/i18n.ts`（代码内文案仍走 i18n）

详细说明见 [docs/03-content-management.md](docs/03-content-management.md)。

## 部署

项目通过 GitHub Actions 在推送 `main` 分支后自动部署到 Cloudflare Workers（SSR + D1 数据库）：

```bash
pnpm install --frozen-lockfile
pnpm check
pnpm build
wrangler d1 migrations apply lordestar-db --remote
wrangler deploy --config dist/server/wrangler.json
```

> 注：M1 起从 Cloudflare Pages 迁移到 Workers（@astrojs/cloudflare v13+ 不再支持 Pages）。内容存在 D1 数据库，`scripts/migrate-content.mjs` 负责把 `src/content/` 的 Markdown 导入数据库。

部署配置、D1 初始化、Secrets 说明见 [docs/04-deployment.md](docs/04-deployment.md)。

## 相关工具说明

- Originkit 组件（`src/components/originkit/`）通过 `bunx --bun originkit@latest add pixeldrift` 拉取，需要 `ORIGINKIT_API_KEY`，配置见 `.env.example`
- `oauth-worker/` 与 `functions/admin/oauth/` 为 M1 前的 Decap OAuth 方案，已退役（`functions/` 现在是 pages.dev 反向代理）
- 关于页照片墙自动读取 `public/photos/`，把要展示的照片（jpg/png/webp/avif）放进该目录即可；当前是脚本生成的占位图，可用 `python scripts/generate-photos.py` 重新生成
