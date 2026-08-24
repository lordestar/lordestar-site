# 开发路线图

> 2026-02 更新：架构已从纯静态迁移为 SSR + D1（Cloudflare Workers）。本文件聚焦站点功能路线；迁移与手机 App 的整体推进见 [08-project-plan.md](08-project-plan.md)。

## 1. 当前状态

### 已完成

- **M1 迁移**：SSR（`output: 'server'`）+ Cloudflare Workers + D1 数据库，内容从 Markdown 迁入 `works`/`posts` 表，页面实时读库
- **M1.5 代理**：`lordestar.pages.dev` 反向代理到 Worker，国内网络可达，新架构已线上可见
- 中英双语（默认中文），路由 `/` 与 `/en/`
- 首页粒子文字 Hero、作品页点阵 Hero、液态卡片与筛选
- 关于页照片墙（`image-galaxy/engine.ts`，自动读取 `public/photos/`）
- 随想列表与文章详情、作品详情页（Markdown 正文/封面/音频/外链，marked 运行时渲染）
- 音频可视化播放器
- 工程化基础：类型检查、Prettier、CI（format+check+build）

### 进行中 / 阻塞

- **域名 `lordestar.com`**：已注册，实名审核中 → 接入 Cloudflare 绑定 Worker（阻塞项，见 08-project-plan）
- GitHub CI 自动部署：需配置 `CLOUDFLARE_API_TOKEN` Secret
- 作品/文章仍是示例占位，需要替换为真实内容
- 关于页照片仍是脚本生成的占位图
- Decap CMS 已随迁移退役，自建后台（M2）待做

## 2. 优先级路线图

### P0：上线前必须完成

| 事项             | 验收标准                                                             |
| ---------------- | -------------------------------------------------------------------- |
| 真实作品与文章   | 中英文成对，替换全部示例内容                                         |
| 真实照片         | 把本人照片放入 `public/photos/` 即自动出现在关于页照片墙，并压缩尺寸 |
| 后台媒体上传验证 | 线上后台可上传图片/音频并正常引用                                    |

### P1：上线后尽快完成

| 事项             | 验收标准                                   |
| ---------------- | ------------------------------------------ |
| RSS Feed         | `/rss.xml` 输出随想与作品                  |
| Sitemap          | `/sitemap-index.xml` 覆盖全部页面          |
| SEO 完善         | 每页唯一 title/description，OG 图          |
| 英文 404         | `/en/*` 缺失时给出英文提示                 |
| 提取 canvas 脚本 | 移除 `@ts-nocheck`，逻辑迁移到独立 TS 模块 |

### P2：持续优化

| 事项         | 验收标准                       |
| ------------ | ------------------------------ |
| 测试体系     | 关键页面有 Playwright 冒烟测试 |
| 可访问性审计 | 键盘导航、焦点、对比度达标     |
| 性能预算     | 首页 LCP 与 JS 体积有明确预算  |
| 站内搜索     | 支持按标签/关键词检索          |
| 数据统计     | 接入隐私友好的统计方案         |

## 3. Definition of Done

一个功能算「完成」必须满足：

- 代码通过 `pnpm ci`
- 中英文文案完整
- 文档/路线图已更新（如需）
- 桌面与移动端可用
- `prefers-reduced-motion` 下不失控
- 不引入新的生成物或密钥
