import type { APIRoute } from 'astro';
import { isAuthedApi } from '../../../lib/admin';
import { resolveByQuery } from '../../../lib/ncm';

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8' },
  });
}

/** 按关键词搜索网易云歌曲（App「搜索歌名」入口）。需鉴权。 */
export const GET: APIRoute = async ({ url, session, request }) => {
  try {
    const authed = await isAuthedApi(session, request.headers.get('authorization'));
    if (!authed) return json({ error: '未登录或会话过期' }, 401);

    const q = url.searchParams.get('q')?.trim() ?? '';
    if (!q) return json({ error: '缺少参数 q（歌名/歌手）' }, 400);
    if (q.length > 80) return json({ error: '关键词过长' }, 400);

    const result = await resolveByQuery(q);
    return json(result);
  } catch (err) {
    return json({ error: String((err as Error)?.message ?? err) }, 500);
  }
};
