# 工程开发规范

## 1. 总原则

- 小步提交，一次提交只做一个语义单元
- 所有代码通过格式化、类型检查、构建三道门禁
- 内容与代码分离：界面文案进 `i18n.ts`，正文内容进 Content Collections
- 交互逻辑尽量独立成可测试的 TS/TSX 模块
- 不提交生成物、密钥、日志与本机路径

## 2. 分支与提交

### 分支

- `main`：稳定分支，直接部署
- 功能分支：`feat/<short-name>`、`fix/<short-name>`、`docs/<short-name>`
- Codex 自动创建的分支使用 `codex/` 前缀

### 提交信息

采用 Conventional Commits 风格：

```text
feat(works): add work detail page
fix(admin): use local backend in dev
docs(standards): add engineering guidelines
refactor(i18n): extract slug helpers
chore(ci): add PR check workflow
```

常见类型：`feat`、`fix`、`docs`、`refactor`、`chore`、`style`、`test`、`build`、`ci`。

## 3. 代码风格

仓库使用 Prettier，配置见 `.prettierrc.mjs`：

- 2 空格缩进
- 单引号、结尾分号
- 行宽 100
- 尾逗号
- `.astro` 文件使用 `prettier-plugin-astro`
- `src/components/originkit/` 是 CLI 生成的第三方组件目录，不参与格式化，更新时以工具输出为准

提交前运行：

```bash
pnpm format
pnpm format:check
```

## 4. 类型与质量门禁

```bash
pnpm check      # Astro + TypeScript
pnpm build      # 完整构建
pnpm ci         # format:check + check + build
```

CI（`.github/workflows/ci.yml`）在 PR 上强制执行以上门禁。

### TypeScript 约定

- 使用 `astro/tsconfigs/strict`
- 组件 Props 必须显式声明类型
- 内容条目使用 `CollectionEntry<'works'>` / `CollectionEntry<'posts'>`，不要手写窄化结构
- 不写 `any`；确有必要时写 `unknown` 并收窄

## 5. Astro 与组件规范

- 页面统一使用 `BaseLayout` 与 `.container`、`.section` 等既有样式
- 新交互组件优先写成 React/TS 模块，用 `client:load` 挂载
- 大型内联 `<script>` 属于例外项；`DotCutHero`、`MusicVisualizer` 目前用 `@ts-nocheck` 过渡，路线图中需提取为类型化模块
- 照片墙引擎位于 `src/components/image-galaxy/engine.ts`，新增交互逻辑优先参照这种「引擎模块 + Astro 薄组件」的结构
- 视觉动效必须尊重 `prefers-reduced-motion`
- 图标优先使用 `Icon.astro` 内既有 lucide 路径，不重复手绘

## 6. 内容规范

- 中英文成对提交，保持 slug 一致
- frontmatter 必须通过 `src/content.config.ts` 的 schema
- 图片和音频先压缩再入库
- 不把「示例」内容当作正式内容发布

## 7. 安全规范

- Secrets 只存在于本地 `.env` 或平台环境变量中，不写进代码
- 不提交 `.originkit/`、OAuth 回调日志、浏览器截图
- 修改 OAuth 或后台逻辑时，确认 callback URL、`base_url` 与 GitHub OAuth App 一致
- 新页面需要设置 `target="_blank"` 时，同时加 `rel="noreferrer"`

## 8. 评审清单

- [ ] 格式检查通过
- [ ] 类型检查通过
- [ ] 构建通过
- [ ] 文案在 `i18n.ts` 中，未硬编码
- [ ] 中英文内容同步
- [ ] 无新生成物/密钥提交
- [ ] 交互在移动端与 reduced-motion 下可用
