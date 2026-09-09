# 独立 Android App（Lordestar，自用）重构规划

> 状态：规划定稿（2026-02）
> 背景：网站内嵌的 `/app`（PWA「记一笔」）体验不满足要求。经确认改为**真安装的原生 Android App**，仅站长本人使用；网站保留全部展示页面与 `/admin`，移除手机记录入口。

## 1. 结论（用户已确认）

| 决策点   | 结论                                                                                  |
| -------- | ------------------------------------------------------------------------------------- |
| 平台     | Android（单平台）                                                                     |
| 形态     | **真安装原生 App**：桌面图标 + 独立窗口 + 系统级接收「网易云分享」                    |
| 使用者   | 仅站长本人，无多用户/注册体系                                                         |
| 功能     | 保留三种记录（歌 / 文字 / 照片）；App 内直接浏览 / 编辑 / 删除历史                    |
| 网站     | **移除「记一笔」入口**（FAB / /app 页面 / Share Target 全部下线，/app* 重定向回首页） |
| 离线草稿 | 不做（未勾选）；弱网失败提示重试                                                      |
| 成本     | ¥0/月：本地 Flutter 构建 APK 侧载安装，不经过任何商店                                 |

## 2. 技术选型

- **App 引擎：Flutter 3.44**（本机已装，D 盘）。产出为**编译型原生 APK**（Skia 自绘，非 WebView 壳）；系统「分享 → 记歌」由 Android 原生 Kotlin 的 `ACTION_SEND` Intent 接收，经 MethodChannel 交给 Dart。对比纯 Kotlin + Compose：UI 迭代成本低得多，自用 App 完全够用。
- **后端不变**：仍是 Cloudflare Workers（Astro SSR）+ D1 + KV + GitHub 媒体库。App 是现有 `/api/*` 的第二个客户端。
- **鉴权**：新增 Worker 密钥 `APP_TOKEN`。全部 `/api/*` 写接口与「全量列表」接受两种凭据之一：
  1. 网站后台 Session cookie（`/admin` 登录，现状）；
  2. `Authorization: Bearer <APP_TOKEN>`（App 专用，Token 在 App 设置页粘贴一次，存本机；可随时轮换）。
- **存储**：token 存 Android 本机（shared_preferences）；照片先压缩（≤1920px/85%）再传 `/api/upload`（GitHub 媒体库，20MB 上限内）。
- **联网**：服务端 base URL 默认 `https://lordestar.cn`（设置页可改，便于调试）。

## 3. 服务端改动清单（S1 / S2）

1. `src/lib/admin.ts` 增加 `isAuthedApi(request, session)`：Session 或 Bearer 任一生效。
2. 应用到接口：`/api/diary`（GET 全量 / POST）、`/api/diary/[id]`（GET/PUT/DELETE）、`/api/ncm/resolve`、`/api/upload`。
3. `GET /api/diary`：带凭据返回 `listAllDiary`（含私有，按时间倒序），App 历史列表直接消费；无需新端点。
4. 新增 `GET /api/ncm/search?q=歌名 歌手`（可选增强）：`searchSongId` → `fetchSongMeta` → `storeCover` 返回歌曲，供 App「按歌名搜索」入口。
5. **移除网站记一笔**：
   - 删 `src/pages/app/` 三个页面与 `src/components/app/*`；
   - 首页 FAB、导航/页脚里所有指向 `/app` 的入口删除；
   - PWA manifest 的 share_target 与 `/app/new?share=` 快捷入口删除（manifest/SW 若保留则只做站点阅读缓存）；
   - 新增 `/app/[...path].ts` 统一 301 重定向回 `/`；
   - `/api/*` 与展示页 `/diary`、首页 Holo 卡、瀑布流**全部保留**。
6. 线上设置 `APP_TOKEN` secret（wrangler secret put / dashboard），CI 部署后抽验 Bearer 鉴权。

## 4. App 功能规格（lordestar-app/，Flutter）

包名 `cn.lordestar.app`，显示名「Lordestar」，Material 3 暖白纸张风（对齐网站视觉），中文界面。底部导航三页：

### 4.1 记录（首页 Tab）

三个大入口卡片：

- **记歌**：粘贴网易云分享文本/链接（或手动搜索）→ 解析 → 预览卡（封面 / 歌名 / 歌手 / 专辑）→ 备注 + 「公开」开关 → 保存。
  - 解析失败/无封面时可手动补填标题/歌手后保存（封面留空，网站 Holo 卡走占位）。
  - **系统分享直达**：网易云点「分享」→ 选 Lordestar → App 直接打开记歌页、自动填入并解析（Kotlin 收 `ACTION_SEND text/plain`，冷/热启动都处理）。
- **记感想**：正文输入 → 公开开关 → 保存（标题自动取正文前 20 字）。
- **拍照片**：相机/相册选 1 张 → 压缩预览 → 配文 + 公开开关 → 先传 `/api/upload` 再建记录。

### 4.2 历史 Tab

- 全量记录（含私有），按月分组倒序时间线；
- 卡片按 kind：歌（封面 + 歌名/歌手）、文字（正文摘要）、照片（缩略图 + 配文）；
- 下拉刷新；点卡片进详情 → **编辑**（标题/备注/公开开关，歌可改歌手）与**删除**（二次确认）；
- 编辑上传新照片、删除照片文件属后续增强（避免孤儿文件）——先支持文案/开关编辑。

### 4.3 设置 Tab

- APP_TOKEN 粘贴保存、「测试连接」、服务器地址（默认 lordestar.cn）、版本与说明（记录会同步展示到 lordestar.cn）。

### 4.4 依赖

`http`（REST + multipart）、`shared_preferences`（token）、`image_picker`（相机/相册 + 压缩参数）。分享接收零第三方依赖（原生 Kotlin 手写）。

## 5. 构建与交付（S4）

- 国内网络适配：`PUB_HOSTED_URL=https://pub.flutter-io.cn`、`FLUTTER_STORAGE_BASE_URL=https://storage.flutter-io.cn`；Gradle wrapper 用腾讯镜像 distributionUrl；Gradle 仓库改阿里云镜像（google/central/gradle-plugin）。
- C 盘仅 2.6GB：`GRADLE_USER_HOME=D:\.gradle`、`PUB_CACHE=D:\pub-cache`，全部缓存落 D 盘（34.5GB）。
- 生成专属 release keystore（keytool，不入库、gitignore），`flutter build apk --release` 产出签名一致 APK，便于日后覆盖安装升级。
- 交付：APK 文件 + 安装说明（开启「允许安装未知应用」→ 拷贝/网盘安装 → 设置页粘贴 token）。

## 6. 里程碑与验收

| 阶段 | 内容                                                      | 验收                                                                     |
| ---- | --------------------------------------------------------- | ------------------------------------------------------------------------ |
| S1   | 服务端 Bearer 鉴权 + `/api/ncm/search` + APP_TOKEN secret | curl 用 Bearer 可 GET/POST/PUT/DELETE diary、resolve、upload；无凭据 401 |
| S2   | 网站移除记一笔入口 + /app 重定向 + manifest/SW 清理       | `/app*` 301→`/`，页面无残留入口，CI 部署绿                               |
| S3   | Flutter App 三流程 + 历史编辑删除 + 设置 token + 分享接收 | analyze 0 issue；本地单测通过；自测清单逐项过                            |
| S4   | 镜像/keystore 配置，产出 release APK                      | APK 生成、签名一致                                                       |
| S5   | 用户侧装验收（真机）+ 文档/README 更新                    | 真机记录 → 网站实时可见                                                  |

## 7. 风险

- 网易云解析受对方接口/网络影响（已有文案兜底，App 内可手动补填）；
- 首次 Gradle/依赖下载量大且走国内镜像，需耐心（一次性）；
- 侧载安装需用户在手机上允许未知来源（一次性）；
- 隐私：APP_TOKEN 泄漏等于可写全部记录 → 只存自用手机 + 可随时轮换。
