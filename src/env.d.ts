/// <reference types="@cloudflare/workers-types" />
/// <reference path="../.astro/types.d.ts" />
/// <reference types="astro/client" />

declare namespace Cloudflare {
  interface Env {
    /** D1 内容数据库（wrangler.toml 中绑定为 DB） */
    DB?: D1Database;
    /** KV 媒体元数据（wrangler.toml 中绑定为 MEDIA_KV） */
    MEDIA_KV?: KVNamespace;
    /** 后台管理密码（线上用 wrangler secret put，本地用 .dev.vars） */
    ADMIN_PASSWORD?: string;
    /** GitHub 媒体库 Token（线上用 wrangler secret put，本地用 .dev.vars） */
    GITHUB_TOKEN?: string;
    /** GitHub 媒体库配置（wrangler.toml vars） */
    GITHUB_OWNER?: string;
    GITHUB_REPO?: string;
    GITHUB_BRANCH?: string;
  }
}

declare namespace App {
  interface SessionData {
    admin: boolean;
  }
}
