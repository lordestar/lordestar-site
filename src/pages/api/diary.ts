import type { APIRoute } from 'astro';
import {
  createDiary,
  listAllDiary,
  listPublicDiary,
  requireDb,
  type DiaryInput,
} from '../../lib/data';

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

/** GET：记录列表（未登录仅公开；登录后全部）。POST：新增记录（需登录）。 */
export const GET: APIRoute = async ({ session }) => {
  const db = await requireDb();
  const authed = (await session?.get('admin')) === true;
  const items = authed ? await listAllDiary(db) : await listPublicDiary(db);
  return json({ items });
};

export const POST: APIRoute = async ({ request, session }) => {
  try {
    const authed = (await session?.get('admin')) === true;
    if (!authed) return json({ error: '未登录或会话过期' }, 401);

    const parsed = parseDiaryInput(await request.json().catch(() => null));
    if (!parsed.ok) return json({ error: parsed.error }, 400);

    const id = await createDiary(await requireDb(), parsed.value);
    return json({ id, ok: true }, 201);
  } catch (err) {
    return json({ error: String((err as Error)?.message ?? err) }, 500);
  }
};
