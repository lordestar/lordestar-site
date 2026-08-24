import type { APIRoute } from 'astro';
import {
  deleteDiary,
  getDiaryByDbId,
  requireDb,
  updateDiary,
  type DiaryInput,
} from '../../../lib/data';

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8' },
  });
}

function parseDiaryInput(
  body: unknown,
): { ok: true; value: DiaryInput } | { ok: false; error: string } {
  const b = (body ?? {}) as Record<string, unknown>;
  const kind = b.kind === 'text' || b.kind === 'photo' ? b.kind : 'song';
  const title = String(b.title ?? '').trim();
  if (!title) return { ok: false, error: '缺少标题 title' };
  return {
    ok: true,
    value: {
      kind,
      title,
      artist: String(b.artist ?? ''),
      album: String(b.album ?? ''),
      cover: String(b.cover ?? ''),
      ncmId: typeof b.ncmId === 'number' ? b.ncmId : null,
      songUrl: String(b.songUrl ?? ''),
      note: String(b.note ?? ''),
      images: Array.isArray(b.images) ? b.images.map(String) : [],
      public: b.public === true || b.public === 1,
    },
  };
}

/** GET：单条记录（私有需登录）。PUT/DELETE：需登录。 */
export const GET: APIRoute = async ({ params, session }) => {
  const db = await requireDb();
  const id = Number(params.id ?? 0);
  if (!id) return json({ error: '缺少 id' }, 400);

  const item = await getDiaryByDbId(db, id);
  if (!item) return json({ error: '记录不存在' }, 404);

  const authed = (await session?.get('admin')) === true;
  if (!item.public && !authed) return json({ error: '无权访问' }, 403);

  return json({ item });
};

export const PUT: APIRoute = async ({ request, params, session }) => {
  try {
    const authed = (await session?.get('admin')) === true;
    if (!authed) return json({ error: '未登录或会话过期' }, 401);

    const id = Number(params.id ?? 0);
    if (!id) return json({ error: '缺少 id' }, 400);

    const parsed = parseDiaryInput(await request.json().catch(() => null));
    if (!parsed.ok) return json({ error: parsed.error }, 400);

    await updateDiary(await requireDb(), id, parsed.value);
    return json({ ok: true });
  } catch (err) {
    return json({ error: String((err as Error)?.message ?? err) }, 500);
  }
};

export const DELETE: APIRoute = async ({ params, session }) => {
  try {
    const authed = (await session?.get('admin')) === true;
    if (!authed) return json({ error: '未登录或会话过期' }, 401);

    const id = Number(params.id ?? 0);
    if (!id) return json({ error: '缺少 id' }, 400);

    await deleteDiary(await requireDb(), id);
    return json({ ok: true });
  } catch (err) {
    return json({ error: String((err as Error)?.message ?? err) }, 500);
  }
};
