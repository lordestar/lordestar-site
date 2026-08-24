# 部署与 CI/CD

> 2026-02 更新：随 M1（SSR + D1）迁移，部署目标从 Cloudflare **Pages** 改为 **Workers**（@astrojs/cloudflare v13+ 已移除 Pages 支持）。内容数据存于 D1，`functions/` 与 Decap OAuth 已退役。

## 1. 部署架构

```text
GitHub push main
      │
      ▼
GitHub Actions（deploy.yml）
      │
      ├── pnpm install --frozen-lockfile
      ├── pnpm check
      ├── pnpm build                # 产出 dist/client（静态）+ dist/server（worker）
      ├── wrangler d1 migrations apply lordestar-db --remote
      └── wrangler deploy --config dist/server/wrangler.json
```

- 运行时：Cloudflare **Workers**（含 ASSETS 静态资源绑定、D1 `DB` 绑定、KV `SESSION`、Images `IMAGES`）；
- 内容：`works` / `posts` 表存于 D1（`migrations/0001_init.sql`）；
- 静态资源与安全头：`dist/client` 经 ASSETS 绑定托管，`public/_headers` 生效；
- 本地开发：`pnpm dev` 无 D1 时自动回退到内容集合（`src/content/**`），零配置可跑。

## 2. 环境要求

- Node ≥ 22，pnpm ≥ 11（`packageManager: pnpm@11.16.0`）；
- `wrangler.toml`：D1 绑定 `lordestar-db`（database_id 需在创建后回填）。

## 3. D1 数据库（一次性初始化）

```bash
# 1. 创建数据库（返回 database_id，回填到 wrangler.toml）
npx wrangler d1 create lordestar-db

# 2. 建表（远程）
npx wrangler d1 migrations apply lordestar-db --remote

# 3. 导入现有内容（由 scripts/migrate-content.mjs 生成 seed-data.sql）
node scripts/migrate-content.mjs
npx wrangler d1 execute lordestar-db --remote --file=scripts/seed-data.sql

# 本地开发也建一份（可选，否则 dev 走内容集合兜底）
npx wrangler d1 migrations apply lordestar-db --local
```

## 4. GitHub Actions Secrets

在仓库 Settings > Secrets and variables > Actions 配置：

| Secret                  | 用途                                                   |
| ----------------------- | ------------------------------------------------------ |
| `CLOUDFLARE_API_TOKEN`  | Cloudflare API Token，需 Workers Scripts + D1 编辑权限 |
| `CLOUDFLARE_ACCOUNT_ID` | Cloudflare 账号 ID                                     |

## 5. 域名

- **线上主域名：`https://lordestar.cn`**（2026-08 上线）
  - 注册商：阿里云；DNS：Cloudflare（free plan）
  - Worker 自定义域名：`wrangler.toml` 中 `routes = [{ pattern = "lordestar.cn", custom_domain = true }]`，`wrangler deploy` 自动建 DNS 记录 + 免费 SSL
- `lordestar.pages.dev`：Pages 反向代理（`functions/[[path]].js` 转发到 `https://lordestar.cn`），作为备用入口继续可用
- 绑定自定义域名后 workers.dev 路由自动停用（`lordestar.<account>.workers.dev` 不再可用）

## 6. 安全与缓存头

`public/_headers` 已配置：

- 全局安全头（`X-Content-Type-Options`、`X-Frame-Options`、`Referrer-Policy`、`Permissions-Policy`）
- `/assets/*` 长期缓存
- `/admin/*` 禁止缓存

## 7. 退役内容

- `functions/admin/oauth/*`（Pages Functions GitHub OAuth）：已随迁移失效，M2 用自建后台 + Cloudflare Access 替代；
- `oauth-worker/`：备用方案，不再需要；
- Decap CMS（`public/admin/`）：内容已迁入 D1，后台由 M2 自建表单页替代。

## 8. 发布检查清单

- [ ] `pnpm ci` 本地通过
- [ ] PR 的 CI 流水线通过
- [ ] `wrangler d1 migrations apply lordestar-db --remote` 成功
- [ ] Worker 部署成功，workers.dev 预览地址可访问
- [ ] 首页/作品/想法/详情页与双语路由正常，内容来自 D1
- [ ] `_headers` 生效
