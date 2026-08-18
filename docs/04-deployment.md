# 部署与 CI/CD

## 1. 部署架构

```text
GitHub push main
      │
      ▼
GitHub Actions（deploy.yml）
      │
      ├── pnpm install --frozen-lockfile
      ├── pnpm check
      ├── pnpm build
      └── wrangler pages deploy dist --project-name lordestar
```

静态资源由 Cloudflare Pages 托管，`functions/` 目录会自动作为 Pages Functions 部署，提供 `/admin/oauth/*`。

## 2. GitHub 仓库准备

仓库当前假设为 `lordestar/lordestar-site`，如仓库地址变化，需要同步修改：

- `public/admin/config.prod.yml` 中的 `repo`
- OAuth App 的 callback URL

## 3. Cloudflare Pages 项目

项目已部署为 `lordestar.pages.dev`。以下步骤适用于新环境复现或迁移：

```bash
wrangler pages project create lordestar --production-branch main
wrangler pages deploy dist --project-name lordestar --branch main
```

## 4. GitHub Actions Secrets

在仓库 Settings > Secrets and variables > Actions 配置：

| Secret                  | 用途                                     |
| ----------------------- | ---------------------------------------- |
| `CLOUDFLARE_API_TOKEN`  | Cloudflare API Token，需 Pages Edit 权限 |
| `CLOUDFLARE_ACCOUNT_ID` | Cloudflare 账号 ID                       |

## 5. Decap CMS GitHub OAuth

1. 在 GitHub 创建 OAuth App：
   - Homepage URL：`https://lordestar.pages.dev`
   - Authorization callback URL：`https://lordestar.pages.dev/admin/oauth/callback`
2. 为 Pages 项目配置 Secrets：

```bash
wrangler pages secret put GITHUB_CLIENT_ID --project-name lordestar
wrangler pages secret put GITHUB_CLIENT_SECRET --project-name lordestar
```

3. 确认 `public/admin/config.prod.yml`：
   - `repo: lordestar/lordestar-site`
   - `base_url: https://lordestar.pages.dev/admin/oauth`

## 6. 安全与缓存头

`public/_headers` 已配置：

- 全局安全头（`X-Content-Type-Options`、`X-Frame-Options`、`Referrer-Policy`、`Permissions-Policy`）
- `/assets/*` 长期缓存
- `/admin/*` 禁止缓存

## 7. 独立 Worker 备用方案

`oauth-worker/` 是同一套 OAuth 逻辑的独立 Cloudflare Worker，当前线上使用 Pages Functions，不需要部署。若需要启用：

```bash
cd oauth-worker
pnpm install
pnpm deploy
```

## 8. 发布检查清单

- [ ] `pnpm ci` 本地通过
- [ ] PR 的 CI 流水线通过
- [ ] 线上后台可正常登录
- [ ] `/admin` 与主要页面在线上可访问
- [ ] `_headers` 生效
