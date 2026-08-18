# lordestar

lordestar 的个人网站：音乐作品、代码作品、经历与随想。

技术栈：Astro 静态站 + React 交互岛 + Tailwind CSS 4 + Decap CMS + Cloudflare Pages，中英双语，默认中文。

## 快速开始

```bash
pnpm install
pnpm dev
```

打开 `http://localhost:4321`。中文为默认语言，英文在 `/en/`。

需要同时使用内容后台时：

```bash
pnpm dev:admin
```

然后打开 `http://localhost:4321/admin`，走 Decap local backend，保存的内容直接写入 `src/content/`。

## 常用命令

| 命令                | 说明                        |
| ------------------- | --------------------------- |
| `pnpm dev`          | 启动 Astro 开发服务器       |
| `pnpm dev:admin`    | 启动 Astro + Decap 本地后台 |
| `pnpm build`        | 构建静态站点到 `dist/`      |
| `pnpm preview`      | 本地预览构建产物            |
| `pnpm check`        | Astro + TypeScript 类型检查 |
| `pnpm format`       | 用 Prettier 格式化全部代码  |
| `pnpm format:check` | 检查格式是否符合规范        |
| `pnpm clean`        | 清理 `dist/` 与 `.astro/`   |
| `pnpm ci`           | 本地跑一遍完整质量门禁      |

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

- 后台地址：`/admin`
- 本地：`pnpm dev:admin`，文件系统模式，无需 GitHub 登录
- 线上：GitHub OAuth 登录，内容通过提交写入仓库
- 作品：`src/content/works/{zh,en}/*.md`
- 随想：`src/content/posts/{zh,en}/*.md`
- 站点文案：`src/i18n.ts`

详细说明见 [docs/03-content-management.md](docs/03-content-management.md)。

## 部署

项目通过 GitHub Actions 在推送 `main` 分支后自动部署到 Cloudflare Pages：

```bash
pnpm install --frozen-lockfile
pnpm check
pnpm build
wrangler pages deploy dist --project-name lordestar
```

部署配置、OAuth 和 Secrets 说明见 [docs/04-deployment.md](docs/04-deployment.md)。

## 相关工具说明

- Originkit 组件（`src/components/originkit/`）通过 `bunx --bun originkit@latest add pixeldrift` 拉取，需要 `ORIGINKIT_API_KEY`，配置见 `.env.example`
- `oauth-worker/` 是 Decap OAuth 的独立 Worker 备用方案，线上当前使用 `functions/admin/oauth/`
- 关于页照片墙自动读取 `public/photos/`，把要展示的照片（jpg/png/webp/avif）放进该目录即可；当前是脚本生成的占位图，可用 `python scripts/generate-photos.py` 重新生成
