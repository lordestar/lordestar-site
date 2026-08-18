# 内容与 CMS 管理

## 1. 内容位置

```text
src/content/
├── works/
│   ├── zh/   # 中文作品
│   └── en/   # 英文作品
└── posts/
    ├── zh/   # 中文随想
    └── en/   # 英文随想
```

每篇内容是一个带 frontmatter 的 Markdown 文件。同一内容的中英文文件名保持一致（如 `zh/ambient-drift.md` 与 `en/ambient-drift.md`）。

## 2. 后台入口

| 环境 | 启动方式         | 后台地址                            |
| ---- | ---------------- | ----------------------------------- |
| 本地 | `pnpm dev:admin` | `http://localhost:4321/admin`       |
| 线上 | 直接访问         | `https://lordestar.pages.dev/admin` |

本地后台走文件系统模式，不触发 GitHub 提交；线上后台需要 GitHub OAuth，保存内容会提交到仓库。

## 3. Decap 配置机制

`public/admin/` 下有两份配置源文件：

- `config.local.yml`：`local_backend: true`
- `config.prod.yml`：GitHub OAuth 后端

`scripts/copy-admin.mjs` 会在以下时机把对应配置复制成 `config.yml`：

- `pnpm dev`：本地配置
- `pnpm build` / `postinstall`：线上配置

`config.yml` 与 `decap-cms.js` 均为生成物，已加入 `.gitignore`。

## 4. 作品字段（works）

| 字段       | 类型             | 必填 | 说明                          |
| ---------- | ---------------- | ---- | ----------------------------- |
| `title`    | string           | 是   | 作品标题                      |
| `type`     | `music` / `code` | 是   | 作品类型                      |
| `date`     | date             | 是   | 发布日期，用于排序            |
| `summary`  | string           | 是   | 列表摘要                      |
| `tags`     | string[]         | 否   | 标签                          |
| `link`     | string           | 否   | 外部链接（网易云、GitHub 等） |
| `audio`    | string           | 否   | 音频文件路径                  |
| `cover`    | string           | 否   | 封面图路径                    |
| `featured` | boolean          | 否   | 是否在首页精选展示            |

## 5. 随想字段（posts）

| 字段      | 类型     | 必填 | 说明     |
| --------- | -------- | ---- | -------- |
| `title`   | string   | 是   | 文章标题 |
| `date`    | date     | 是   | 发布日期 |
| `summary` | string   | 是   | 列表摘要 |
| `tags`    | string[] | 否   | 标签     |

## 6. 关于页照片墙

关于页的照片墙读取 `public/photos/` 目录：

- 支持的格式：`.jpg`、`.jpeg`、`.png`、`.webp`、`.avif`
- 按文件名排序展示，建议用 `01-xxx.jpg` 这类前缀控制顺序
- 直接放入或删除照片即可，无需改代码
- 当前目录中的 `galaxy-*.jpg` 是占位图，正式照片放入后可直接替换

## 7. 写作与发布规则

- 中英文内容都要写，且标题、日期语义保持一致
- 新增条目时 Decap 会为两种语言各建一个文件；只填中文就发布时，英文文件暂时为空，站点会自动隐藏英文条目，不会导致构建失败
- 英文编辑区提供 `Fill in from another locale` 按钮，可一键复制中文内容后再改写英文文案
- 图片上传到 `public/uploads/` 或 `public/photos/`，路径以 `/` 开头
- 音频文件上传上限为 30MB（后台配置）
- 示例内容目前仍占位，正式上线前替换为真实内容

## 8. 内容新增检查清单

- [ ] 中英文文件都已创建
- [ ] 英文为空时确认英文页不展示该条目
- [ ] frontmatter 字段完整，日期格式正确
- [ ] 摘要长度适中，不截断 UI
- [ ] 图片/音频已压缩并引用正确路径
- [ ] `pnpm check` 通过
