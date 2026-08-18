# 本地开发指南

## 1. 环境要求

| 工具                    | 版本                           |
| ----------------------- | ------------------------------ |
| Node.js                 | 22+                            |
| pnpm                    | 11+（仓库声明 `pnpm@11.16.0`） |
| Bun（可选）             | 仅用于拉取 Originkit 组件      |
| Python + Pillow（可选） | 仅用于重新生成占位照片         |

## 2. 安装与启动

```bash
pnpm install
pnpm dev
```

只开发页面时运行 `pnpm dev`；需要后台编辑内容时运行：

```bash
pnpm dev:admin
```

`pnpm dev:admin` 会同时启动 Astro（4321 端口）和 Decap proxy server（8081 端口）。

## 3. 环境变量

复制 `.env.example` 为 `.env`（如果不存在）：

```bash
cp .env.example .env
```

当前只有 `ORIGINKIT_API_KEY`，用于本机拉取/更新 Originkit 组件，不要提交真实值。

## 4. 常用开发流程

### 4.1 新增一个普通页面

1. 在 `src/pages/` 下新建 `.astro` 路由（英文对应 `src/pages/en/`）
2. 在 `src/i18n.ts` 的 `ui.zh` / `ui.en` 中补充文案
3. 用 `BaseLayout` 包裹页面，保持导航与页脚一致
4. 运行 `pnpm check` 和 `pnpm format`

### 4.2 新增一个交互组件

1. 优先写成独立 TS/TSX 模块，放在 `src/components/` 下
2. 在 Astro 中使用时通过 `client:load` 挂载为交互岛
3. 所有 Props 必须有类型
4. 避免往 `.astro` 内联 `<script>` 里塞大量逻辑

### 4.3 处理图片与媒体

- 网站静态资源放 `public/`，引用绝对路径如 `/photos/galaxy-01.jpg`
- 关于页照片墙自动读取 `public/photos/`，放入 jpg/png/webp/avif 图片即自动展示
- 后台上传的媒体写入 `public/uploads/`（本地模式）
- 图片按实际用途控制尺寸，优先 WebP/JPG 压缩，不要直接提交超大原图

## 5. 脚本说明

| 脚本                           | 作用                         |
| ------------------------------ | ---------------------------- |
| `scripts/astro.mjs`            | 包装 Astro CLI，默认关闭遥测 |
| `scripts/copy-admin.mjs`       | 复制 Decap CMS 产物与配置    |
| `scripts/dev-admin.mjs`        | 同时启动本地后台与 Astro     |
| `scripts/clean.mjs`            | 清理构建缓存                 |
| `scripts/screenshot-pages.mjs` | 本机截图检查（环境相关）     |
| `scripts/generate-photos.py`   | 生成占位照片                 |

## 6. 常见问题

### Astro 遥测写入报错

所有 Astro 命令已通过 `scripts/astro.mjs` 包装，默认设置 `ASTRO_TELEMETRY_DISABLED=true`。手动执行 `astro` 命令时请自行设置该环境变量。

### pnpm store 位置不一致

如果本机报 `ERR_PNPM_UNEXPECTED_STORE`，说明 node_modules 与当前 pnpm 的 store 配置不一致：

```bash
pnpm add -D <pkg> --store-dir <你机器上已有的 store 路径>
```

或统一设置全局 `store-dir`。不要把本机 store 路径写进仓库。

### 8081 端口被占用

Decap proxy server 固定监听 8081。先结束旧进程再运行 `pnpm dev:admin`。

### 类型检查或格式检查失败

```bash
pnpm format
pnpm check
```

提交前至少保证 `pnpm ci` 通过。
