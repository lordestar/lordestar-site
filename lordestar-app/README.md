# Lordestar App（自用 Android 日记 App）

把「网易云分享的单曲 / 感想文字 / 照片」从手机上直接记到 **lordestar.cn** 的独立原生 App（Flutter 3.44，仅本人使用，不对外发布）。

> 完整需求与实现说明见仓库根目录 [`docs/09-standalone-android-app.md`](../docs/09-standalone-android-app.md)。

## 功能

- **记歌**：网易云 App 分享单曲 → 选择 Lordestar → 自动解析（App 本机直连网易云取歌名/歌手/封面，封面上传本站媒体库）；也可粘贴链接或直接输歌名搜索。
- **记感想 / 拍照片**：文字或照片（相机/相册，自动压缩 ≤1920px）→ 配「公开」开关。
- **历史**：全部记录（含私有）按月分组；详情页可**编辑 / 删除**。
- **设置**：服务器地址（默认 `https://lordestar.cn`）+ **App 令牌**一次粘贴；「测试连接」校验。

数据流向：App（Bearer 令牌）→ `lordestar.cn/api/*`（Cloudflare Workers + D1）→ 网站首页「最近在听」Holo 卡、`/diary`、`/journal` 实时展示。

## 构建（本机，Windows）

首次构建需要：Flutter 3.44+、JDK 17+、Android SDK（本机：`D:\Android`）。

国内网络必须配镜像与缓存目录（构建前在 shell 设置）：

```powershell
$env:PUB_CACHE = 'D:\pub-cache'                      # pub 缓存（避开 C 盘）
$env:GRADLE_USER_HOME = 'D:\.gradle'                 # Gradle 缓存（避开 C 盘）
$env:PUB_HOSTED_URL = 'https://pub.flutter-io.cn'
$env:FLUTTER_STORAGE_BASE_URL = 'https://storage.flutter-io.cn'
flutter pub get
flutter build apk --release
```

产物：`build/app/outputs/flutter-apk/app-release.apk`（已配置签名，见下）。

**签名**：仓库根 `keystore/lordestar.jks`（已在 `.gitignore`，不入库）+ `android/key.properties`。升级安装请保持同一密钥覆盖安装即可。

## 安装到手机（一次性）

1. 把 APK 传到手机（USB/网盘/微信文件传输助手）；
2. 手机上首次安装需允许「安装未知应用」；
3. 打开 App → 「设置」→ 粘贴 **APP_TOKEN**（令牌在你电脑的 `.app-token.txt`，与 lordestar.cn 线上 secret 一致）→ 「测试连接」应显示记录数；
4. 回「记录」页即可使用；网易云 App 里点分享 → 选 Lordestar 可直接跳转记歌。

## 日常使用提示

- 记的歌会出现在网站首页「最近在听」（最新一条公开记录）与日记页；
- 想记录但不公开：关掉「公开」开关，网站不展示；
- 删除 App 内记录 = 删除网站对应内容；照片删除后 GitHub 媒体库中的文件会保留（孤儿文件，后续可清理，不影响展示）；
- 令牌泄漏等于可操作全部记录：只需在 Cloudflare 换新 secret 并把新值重新粘贴进 App（同时更新 `.app-token.txt`）。

## 开发

```powershell
flutter run          # 需要已连接 Android 设备/模拟器
flutter analyze      # 静态检查（应 0 issues）
flutter test         # 单元测试（models）
```

代码结构：`lib/main.dart` 入口 → `lib/src/`：`api.dart`（REST+multipart 客户端）、`ncm_local.dart`（网易云解析，本机执行）、`models.dart`、`store.dart`（token/地址）、`share_bridge.dart`（系统分享接收）、`theme.dart`、`pages/`（记录三页 + 历史 + 设置）。Android 分享接收在 `android/.../MainActivity.kt`（`ACTION_SEND text/plain` → MethodChannel `lordestar/share`）。
