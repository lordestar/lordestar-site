import type { APIRoute } from 'astro';
import { getMedia } from '../../lib/media';

/** 从 GitHub 媒体仓库读取并返回媒体文件（/media/*）。键含时间戳，可长期缓存。 */
export const GET: APIRoute = async ({ params }) => {
  const key = params.key ?? '';
  if (!key) return new Response('Not found', { status: 404 });
  return getMedia(key);
};
