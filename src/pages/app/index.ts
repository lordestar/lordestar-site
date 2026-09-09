import type { APIRoute } from 'astro';

/**
 * 手机记录入口已迁移到独立 Android App（见 docs/09）。
 * /app 与 /app/ 统一 301 回首页。
 */
export const GET: APIRoute = ({ redirect }) => redirect('/', 301);
