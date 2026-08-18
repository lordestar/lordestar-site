# 开发文档总览

这是 lordestar 个人网站的完整开发文档。文档按开发阶段组织，建议新成员按顺序阅读。

| 文档                                                       | 内容                                      |
| ---------------------------------------------------------- | ----------------------------------------- |
| [01-architecture.md](01-architecture.md)                   | 技术架构、目录结构、数据流与组件地图      |
| [02-development.md](02-development.md)                     | 本地环境、常用脚本、开发流程与排错        |
| [03-content-management.md](03-content-management.md)       | 内容模型、双语规则与 Decap CMS 使用       |
| [04-deployment.md](04-deployment.md)                       | Cloudflare Pages、OAuth、Secrets 与 CI/CD |
| [05-engineering-standards.md](05-engineering-standards.md) | 分支、提交、代码风格与质量门禁            |
| [06-roadmap.md](06-roadmap.md)                             | 当前状态、待办路线图与完成标准            |

## 一句话理解项目

Astro 在构建时把 `src/content/` 里的 Markdown 和 `src/i18n.ts` 里的文案渲染成中英双语静态页面；React 只负责少量交互岛（粒子文字、液态卡片）；Decap CMS 让内容创作者直接编辑 Markdown；Cloudflare Pages 负责静态托管和 GitHub OAuth 后台登录。
