# 开发文档总览

这是 lordestar 个人网站的完整开发文档。文档按开发阶段组织，建议新成员按顺序阅读。

| 文档                                                         | 内容                                                 |
| ------------------------------------------------------------ | ---------------------------------------------------- |
| [01-architecture.md](01-architecture.md)                     | 技术架构、目录结构、数据流与组件地图                 |
| [02-development.md](02-development.md)                       | 本地环境、常用脚本、开发流程与排错                   |
| [03-content-management.md](03-content-management.md)         | 内容模型、双语规则与 Decap CMS 使用                  |
| [04-deployment.md](04-deployment.md)                         | Cloudflare Pages、OAuth、Secrets 与 CI/CD            |
| [05-engineering-standards.md](05-engineering-standards.md)   | 分支、提交、代码风格与质量门禁                       |
| [06-roadmap.md](06-roadmap.md)                               | 当前状态、待办路线图与完成标准                       |
| [07-diary-app-requirements.md](07-diary-app-requirements.md) | 手机记录 App（听歌日记/感想/照片）需求分析与成本估算 |
| [08-project-plan.md](08-project-plan.md)                     | 项目推进计划（里程碑、任务清单、阻塞项）             |

## 一句话理解项目

Astro 7 以 SSR 模式部署到 Cloudflare Workers：内容存在 D1 数据库（`works`/`posts`），页面按需渲染；`lordestar.pages.dev` 通过 Pages Function 反向代理到 Worker（国内网络可达）；React 只负责少量交互岛（粒子文字、液态卡片）；本地开发在无 D1 时回退到 `src/content/` 的 Markdown 集合。目标：手机 PWA 记录（听歌/感想/照片）→ 网站实时展示，最终以 lordestar.com 上线。
