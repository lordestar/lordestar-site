import type { APIRoute } from 'astro';
import { resolveShare } from '../../../lib/ncm';

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8' },
  });
}

/** 解析网易云分享文本/链接 → 歌曲信息。需管理员登录。 */
export const POST: APIRoute = async ({ request, session }) => {
  try {
    const authed = (await session?.get('admin')) === true;
    if (!authed) return json({ error: '未登录或会话过期' }, 401);

    let text = '';
    const contentType = request.headers.get('content-type') ?? '';
    if (contentType.includes('application/json')) {
      const body = (await request.json()) as { text?: string };
      text = body.text ?? '';
    } else {
      const form = await request.formData();
      text = String(form.get('text') ?? '');
    }

    const result = await resolveShare(text);
    return json(result);
  } catch (err) {
    return json({ error: String((err as Error)?.message ?? err) }, 500);
  }
};
