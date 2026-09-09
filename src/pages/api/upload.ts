import type { APIRoute } from 'astro';
import { isAuthedApi } from '../../lib/admin';
import { putMedia } from '../../lib/media';

const MAX_SIZE = 20 * 1024 * 1024; // 20MB（GitHub 单文件上限 100MB）

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8' },
  });
}

/** 文件名校净化：只保留字母数字和扩展名。 */
function sanitizeName(name: string): string {
  const base = name.replace(/[^a-zA-Z0-9.\-_]/g, '').slice(-80);
  return base || 'file';
}

/** 上传文件到 GitHub 媒体仓库，返回可访问的 URL。需鉴权（后台会话或 App 令牌）。 */
export const POST: APIRoute = async ({ request, session }) => {
  try {
    const authed = await isAuthedApi(session, request.headers.get('authorization'));
    if (!authed) return json({ error: '未登录或会话过期' }, 401);

    const form = await request.formData();
    const file = form.get('file');
    if (!(file instanceof File)) return json({ error: '缺少文件字段 file' }, 400);
    if (file.size <= 0) return json({ error: '文件为空' }, 400);
    if (file.size > MAX_SIZE) return json({ error: '文件超过 20MB 限制' }, 400);

    const key = `uploads/${Date.now()}-${sanitizeName(file.name)}`;
    const bytes = new Uint8Array(await file.arrayBuffer());
    await putMedia(key, bytes, file.type || 'application/octet-stream');

    return json({ url: `/media/${key}`, key });
  } catch (err) {
    return json({ error: String((err as Error)?.message ?? err) }, 500);
  }
};
