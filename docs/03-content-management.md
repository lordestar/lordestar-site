# 内容与后台管理

> 2026-02 更新：Decap CMS 已随 M1 迁移退役（内容存于 D1），后台改为自建页面。

## 1. 内容存储

内容存在 **D1 数据库**（`lordestar-db`）：

| 表      | 内容              | 关键字段                                                                           |
| ------- | ----------------- | ---------------------------------------------------------------------------------- |
| `works` | 作品（音乐/代码） | locale、slug、title、type、date、summary、tags、link、audio、cover、featured、body |
| `posts` | 文章（想法）      | locale、slug、title、date、summary、tags、body                                     |

- 中英文双语：同一内容两条记录（`locale` = `zh` / `en`），`slug` 保持一致；
- 正文为 Markdown，前台用 `marked` 运行时渲染；
- 本地开发在无 D1 时可回退到 `src/content/**` 的 Markdown（只读，用于开发兜底）。

## 2. 后台入口

| 环境 | 地址                                | 说明                                         |
| ---- | ----------------------------------- | -------------------------------------------- |
| 本地 | `http://localhost:4321/admin`       | 需本地 D1（`pnpm db:local`）或用内容集合兜底 |
| 线上 | `https://lordestar.pages.dev/admin` | 密码登录（`ADMIN_PASSWORD` 密钥）            |

后台功能：

- **作品**：列表 / 新建 / 编辑 / 删除（语言、slug、标题、类型、日期、摘要、标签、封面、音频、外链、精选、Markdown 正文）
- **文章**：列表 / 新建 / 编辑 / 删除
- **上传**：封面/音频可上传（存 GitHub 媒体仓库 `lordestar/lordestar-media`，免费空间大；元数据存 KV；上限 20MB/文件）
- 保存后前台**立即生效**，无需 git 提交

## 3. 登录与密钥

- 会话用 Astro Session（KV 存储 + Cookie），7 天有效；
- 密码存在环境变量/密钥 `ADMIN_PASSWORD`：
  - 线上：`npx wrangler secret put ADMIN_PASSWORD`
  - 本地：`.dev.vars` 文件（已 gitignore）
- 改密码：`npx wrangler secret put ADMIN_PASSWORD` 输入新值即可。

## 4. 作品字段（works）

| 字段       | 类型             | 说明                                      |
| ---------- | ---------------- | ----------------------------------------- |
| `locale`   | `zh` / `en`      | 语言                                      |
| `slug`     | string           | URL 标识（`/works/:slug/`），同语言下唯一 |
| `title`    | string           | 标题                                      |
| `type`     | `music` / `code` | 类型                                      |
| `date`     | YYYY-MM-DD       | 日期                                      |
| `summary`  | string           | 摘要                                      |
| `tags`     | string[]         | 标签                                      |
| `link`     | string?          | 外部链接                                  |
| `audio`    | string?          | 音频 URL                                  |
| `cover`    | string?          | 封面 URL                                  |
| `featured` | boolean          | 首页"近期作品"展示                        |
| `body`     | markdown         | 正文                                      |

## 5. 文章字段（posts）

| 字段      | 类型        | 说明                           |
| --------- | ----------- | ------------------------------ |
| `locale`  | `zh` / `en` | 语言                           |
| `slug`    | string      | URL 标识（`/thoughts/:slug/`） |
| `title`   | string      | 标题                           |
| `date`    | YYYY-MM-DD  | 日期                           |
| `summary` | string      | 摘要                           |
| `tags`    | string[]    | 标签                           |
| `body`    | markdown    | 正文                           |
