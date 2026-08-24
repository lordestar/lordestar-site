import type { APIRoute } from 'astro';

/** 退出登录：销毁会话并回到登录页。 */
export const POST: APIRoute = async ({ session }) => {
  try {
    session?.destroy();
  } catch {
    // 会话不存在也照常退出
  }
  return new Response(null, {
    status: 302,
    headers: { Location: '/admin/login' },
  });
};
