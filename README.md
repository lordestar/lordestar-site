# lordestar

lordestar 的个人网站：音乐作品、代码作品、经历与随想。Astro 静态站 + React 粒子动效 + Decap CMS 可视化后台，中英双语，默认中文。

## 技术栈

- Astro 7 + TypeScript，静态输出到 `dist/`
- React island：首页 lordestar Pixel Drift 粒子文字
- Tailwind CSS 4（Originkit 组件扫描 `src/components/originkit`）
- Decap CMS（`/admin`，内容写入 `src/content/` 的 Markdown）
- 部署目标：Cloudflare Pages（免费）

## 本地开发

```bash
pnpm install
pnpm dev
```

访问 `http://localhost:4321`。中文为默认语言，英文在 `/en/`。

拉取/更新 Originkit 组件时需要 `ORIGINKIT_API_KEY` 环境变量，例如：

```bash
$env:ORIGINKIT_API_KEY="..."
bunx --bun originkit@latest add pixeldrift
```

API Key 只用于本机 CLI 运行，不要写入代码或提交到 git（`.originkit/` 已在 `.gitignore`）。

## 内容管理

后台地址：`/admin`（本地 `pnpm dev` 时也可打开）。

- 作品：`src/content/works/{zh,en}/*.md`，支持上传音频文件（`audio`）或填外部链接（`link`）
- 随想：`src/content/posts/{zh,en}/*.md`
- 站点文案：`src/i18n.ts`

Decap CMS 配置在 `public/admin/config.yml`，其中 `repo`、`base_url` 需要在部署后替换为真实值。

## 部署到 Cloudflare Pages

1. 在 GitHub 创建仓库 `lordestar-site`，然后把本目录推上去：

   ```bash
   git remote add origin git@github.com:lordestar/lordestar-site.git
   git push -u origin main
   ```

2. 注册/登录 Cloudflare，进入 **Workers & Pages** > **Create** > **Pages** > **Connect to Git**，选择该仓库。

3. 构建设置：
   - Framework preset：`Astro`
   - Build command：`pnpm install --frozen-lockfile && pnpm run build`
   - Build output directory：`dist`
   - Node.js version：`22`
   - Production branch：`main`

4. 首次构建完成后会得到 `lordestar.pages.dev` 地址，之后每次 push 自动重新部署。

## Decap CMS 后台登录配置

Decap CMS 的 GitHub 登录需要一个 OAuth 服务，推荐部署一个免费 Cloudflare Worker：

1. 在 GitHub 创建 OAuth App：Settings > Developer settings > OAuth Apps > New OAuth App。
   - Homepage URL：你的站点地址，例如 `https://lordestar.pages.dev`
   - Authorization callback URL：`https://<your-oauth-worker>.workers.dev/callback`
2. 把生成的 `GITHUB_CLIENT_ID` / `GITHUB_CLIENT_SECRET` 配置到 OAuth Worker 的环境变量。
3. 更新 `public/admin/config.yml`：
   - `repo: lordestar/lordestar-site`
   - `base_url: https://<your-oauth-worker>.workers.dev`
4. 提交并推送，Cloudflare Pages 会自动重新部署；之后访问 `/admin` 即可用 GitHub 登录后台。
