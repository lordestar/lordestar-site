import type { APIRoute } from 'astro';

/**
 * 手机记录入口已迁移到独立 Android App（见 docs/09）。
 * /app/*（含旧 /app/new?share= Web Share Target 链接）统一 301 回首页。
 */
export const GET: APIRoute = ({ redirect }) => redirect('/', 301);
