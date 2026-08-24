# 项目推进计划（Master Plan / Spec）

> 状态：2026-02 · 持续更新
> 目标：lordestar 个人站从纯静态迁移到「服务器 + 数据库」架构，并落地手机记录 App（听歌日记 / 感想 / 照片），全程 Cloudflare 免费栈，最终以 lordestar.com 对外。

## 0. 目标与约束

- **功能目标**：手机 App（PWA）粘贴网易云链接记歌、发文字感想、传照片配文；网站实时展示（首页"最近在听"、想法列表）。
- **成本约束**：¥0/月（Cloudflare 免费额度）；唯一可接受开支：域名（lordestar.com，约 ¥65-95/年）。
- **网络约束**：国内网络可访问。workers.dev 部分 IP 被封锁 → 已用 pages.dev 代理解决；域名就绪后绑定 Worker。
- **架构**：Astro 7 SSR + Cloudflare Workers + D1（SQLite）+ KV（媒体存储）+ ASSETS（静态）。

## 1. 当前状态快照

| 里程碑                   | 状态    | 说明                                                |
| ------------------------ | ------- | --------------------------------------------------- |
| M0 需求分析              | ✅ 完成 | docs/07-diary-app-requirements.md                   |
| M1 SSR + D1 迁移         | ✅ 完成 | 代码、数据库、Worker 已部署，页面从 D1 读数据       |
| M1.5 pages.dev 代理      | ✅ 完成 | lordestar.pages.dev 已能访问新站（D1 + SSR）        |
| M5 域名 lordestar.cn     | ✅ 完成 | https://lordestar.cn 上线（绑定 Worker + SSL）      |
| M5 CI 自动部署           | ⏳ 待办 | GitHub Secrets（API Token）未配置                   |
| M2 自建后台              | ✅ 完成 | /admin 密码登录 + 作品/文章 CRUD，已上线            |
| M3 听歌日记 + 最近在听卡 | ⬜ 待办 | 核心功能                                            |
| M4 手机 App（PWA 记录）  | ✅ 完成 | /app/new 记一笔 + /app/records + PWA + Share Target |
| M6 增强                  | ⬜ 可选 |                                                     |

## 2. 里程碑总览与依赖

```text
M1 ✅ ──► M1.5 ✅ ──► M5(域名) ⏳ ──► M5(CI) ──► M2 ──► M3 ──► M4 ──► M6(可选)
                      （M1.5 在域名就绪后仍保留，作为兜底入口）
```

- **当前唯一阻塞项**：域名实名审核（注册商处理中，通常 1-3 天）。
- 其余里程碑**不依赖域名**，可立即推进。

## 3. 里程碑详细任务

### M5 · 域名上线 ✅ 已完成（lordestar.cn）

- [x] 注册域名（阿里云 · lordestar.cn）
- [x] 实名审核通过
- [x] 在 Cloudflare 创建站点（free plan）→ 获取 2 个 Nameserver
- [x] 阿里云改 Nameserver 为 Cloudflare 的（carlane / hunts.ns.cloudflare.com）
- [x] wrangler.toml 加 custom domain routes（`lordestar.cn`）
- [x] `wrangler deploy` 绑定域名 → **https://lordestar.cn 上线**（自动建 DNS + SSL）
- [x] astro.config.mjs `site` 改为 https://lordestar.cn
- [x] 验证：首页/日记/整合页/后台/重定向全部正常（浏览器 + 手机可访问）

> 注：绑定自定义域名后 workers.dev 路由自动停用；pages.dev 代理已改为转发 lordestar.cn，作为备用入口继续可用。

### M5 · CI 自动部署（需要用户提供 API Token）

- [ ] 用户创建 Cloudflare API Token（Workers Scripts Edit + D1 Edit）
- [ ] GitHub 仓库 → Settings → Secrets：`CLOUDFLARE_API_TOKEN`、`CLOUDFLARE_ACCOUNT_ID`
- [ ] 推送 main 触发 deploy.yml：check → build → d1 migrations → worker deploy → pages proxy deploy
- [ ] 验证 PR 的 ci.yml 与 main 的 deploy.yml

### M2 · 自建后台（替换 Decap CMS）✅ 已完成

- [x] `src/lib/data.ts` 增加写操作（createWork/createPost/update/delete，D1 后端）
- [x] `/admin` 登录页（密码 + Astro Session 会话）
- [x] `/admin/works` 列表 + 新建/编辑表单（title/type/date/summary/tags/link/audio/cover/featured/body）
- [x] `/admin/posts` 列表 + 新建/编辑表单
- [x] `/api/upload` 上传接口（KV 媒体存储，已上线验证）
- [x] 删除 Decap 相关（public/admin/*、decap-cms、decap-server、copy-admin.mjs）
- [x] 中文/英文双语字段编辑（locale 切换）
- [x] 验收：后台改内容 → 前台即时生效 ✅（本地 + 生产均已验证）

> 媒体存储选型：R2 启用需绑定支付方式（信用卡/PayPal），用户无 → 改用 **GitHub 媒体仓库**（免费、单文件 ≤100MB、仓库数 GB）+ KV 存元数据。Worker 从 Cloudflare 边缘拉取 raw 文件，国内可正常访问。需 `GITHUB_TOKEN`（repo 权限）写入媒体仓库。

### M3 · 听歌日记 + 最近在听（核心功能）✅ 已完成

- [x] D1 迁移 `0002_diary.sql`：diary 表（kind=song/text/photo）
- [x] 网易云解析：`/api/ncm/resolve`（短链 → 歌曲 id → v3 元数据 → 封面存 GitHub 媒体库）
- [x] 解析失败兜底：搜索 API + 分享文本《歌名》+ 歌手提取 + 手动补填
- [x] `/diary/` 听歌日记页（时间线，中英双语，公开）
- [x] `/api/diary` CRUD（GET 公开 / POST·PUT·DELETE 需登录，已测 401 拦截）
- [x] 首页"最近在听"区块（最新公开 song 记录）
- [x] **Holo 全息卡**：灰白主体 + 专辑封面 + 歌名/歌手 + 指针/陀螺仪倾斜全息效果
- [x] 导航新增"日记"

> 实测：旋木分享链接 → 解析出 id/歌名/歌手/专辑/封面（封面自动下载存库）→ 创建公开日记 → 首页"最近在听"Holo 卡即时更新。已保留旋木作为首条日记。

### M3.5 · 首页改版：瀑布流日记本 ✅ 已完成（2026-08）

- [x] 统一内容流 `getMergedFeed`（作品 + 文章 + 日记 → FeedItem，按日期倒序）
- [x] **瀑布流 Masonry**：模拟 Pinterest"最短列优先"（weight 估算高度，服务端分列，SSR 无布局抖动）
- [x] Holo 卡固定左上角第一张，其余日记本卡（照片/文字/音乐可播放/听歌/文章）分列新→旧
- [x] 移除顶部导航栏；"关于"内容下放首页（简介/事实/轨迹/常出没/联系）
- [x] **作品页 + 想法页整合为 `/journal/`**（全量瀑布流）；`/works`、`/thoughts` 302 重定向
- [x] Footer 承担导航（全部内容/日记/关于 + 语言切换）
- [x] 日记本卡片支持：照片拍立得、音乐 demo 播放器（MusicVisualizer）、代码外链、听歌记录、文章阅读

### M4 · 手机 App（PWA 记录）✅ 已完成

- [x] `/app/new` 记录页（听歌/感想/照片三 Tab，移动端优化）
- [x] 听歌：粘贴网易云分享文本 → 解析 → 预览 → 保存（备注/公开开关）
- [x] 感想：文字直接入库（标题自动取前 20 字）
- [x] 照片：拍照/选图多张上传 → GitHub 媒体库 → 保存
- [x] `/app/records` 我的记录（编辑/删除/公开开关）
- [x] `/app/edit/[id]` 编辑页（按类型预填，照片不丢图）
- [x] **PWA**：manifest + 图标（192/512/maskable）+ Service Worker（静态缓存优先/页面网络优先离线回退）+ 添加到主屏幕
- [x] **Web Share Target**：安卓任意 App 分享 → 直接投递到记一笔并自动解析
- [x] 鉴权：复用后台密码会话（`/admin/login?from=` 登录后跳回）；Cloudflare Access 邮箱验证码列为后续升级项
- [x] 全站"记一笔"悬浮按钮（FAB）+ Footer 入口
- [x] 登录/创建/编辑/删除/公开开关全链路实测（本地 + 生产）

> 说明：照片"压缩"由浏览器端上传前用户自选；M4 的 Access 邮箱登录未做（密码会话对单人已足够），如需可后续升级。

### M6 · 增强（可选，按兴趣推进）

- [ ] Web Share Target（安卓任意 App 分享 → 直接进日记页）
- [ ] 网易云搜索自动补全歌名
- [ ] 原生 App 壳（Flutter/RN）
- [ ] 专辑/歌单分享链接解析
- [ ] RSS / Sitemap（原路线图 P1 项）

## 4. 阻塞项清单

| 阻塞项                      | 影响                   | 解除条件                      | 当前状态  |
| --------------------------- | ---------------------- | ----------------------------- | --------- |
| 域名实名审核                | lordestar.com 无法上线 | 注册商审核通过（1-3 天）      | ⏳ 进行中 |
| GitHub Secrets 缺 API Token | CI 无法自动部署        | 用户创建 Token + 配置 Secrets | ⬜ 未开始 |
| —（其余无阻塞）             |                        |                               |           |

## 5. 下一步行动（本周）

1. **等域名实名通过**（无需你操作，通过了告诉我）
2. **我继续推进 M2 后台**（不依赖域名，可立即开工）
3. 你想先看哪个成果，说一声即可：
   - A. M2 自建后台（能在网页上直接编辑作品/文章）
   - B. M3 网易云解析 + 听歌日记（核心功能）
   - C. 首页"最近在听"Holo 全息卡（视觉优先）
4. 想配置 CI 自动部署时，按 M5-CI 清单创建 API Token

## 6. 验收标准（全局）

- [ ] `pnpm ci` 通过（format + check + build）
- [ ] lordestar.com（或 pages.dev）可访问，双语路由正常
- [ ] 内容来自 D1，后台编辑即时生效
- [ ] 手机 PWA 可添加主屏幕、粘贴网易云链接记歌
- [ ] 隐私默认私有，公开显式勾选
- [ ] 全程 ¥0/月（除域名年费）
