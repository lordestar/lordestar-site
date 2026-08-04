# lordestar Decap OAuth Worker

为 Decap CMS 提供 GitHub OAuth 登录的 Cloudflare Worker。当前线上站点改用 `functions/admin/oauth/`（Pages Functions，挂在 `lordestar.pages.dev/admin/oauth` 下），本目录保留为独立 Worker 备用方案。

## 部署

1. 在 GitHub 创建 OAuth App（Settings > Developer settings > OAuth Apps > New OAuth App）：
   - Homepage URL：你的网站地址，例如 `https://lordestar.pages.dev`
   - Authorization callback URL：`https://lordestar-decap-oauth.<你的 Cloudflare 子域>.workers.dev/callback`
2. 在 `oauth-worker/` 下安装依赖：

   ```bash
   cd oauth-worker
   pnpm install
   ```

3. 本地调试可复制 `.dev.vars.example` 为 `.dev.vars` 并填入真实值；生产环境用 secret 配置：

   ```bash
   pnpm wrangler secret put GITHUB_CLIENT_ID
   pnpm wrangler secret put GITHUB_CLIENT_SECRET
   ```

4. 部署：

   ```bash
   pnpm deploy
   ```

5. 把 `public/admin/config.yml` 的 `base_url` 改成 Worker 地址（不带结尾斜杠），提交并推送，Cloudflare Pages 会自动重新部署。

## 接口

- `GET /auth`：跳转到 GitHub 授权页
- `GET /callback`：换取 token 并通过 `postMessage` 交回 Decap CMS 页面

安全注意：`GITHUB_CLIENT_SECRET` 只放在 Cloudflare secret 或本地 `.dev.vars`，不要提交到 git。
