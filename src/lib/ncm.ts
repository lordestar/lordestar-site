/**
 * 网易云音乐分享链接解析。
 *
 * 流程：
 *   1. 从分享文本提取 URL（https?://...）
 *   2. 跟随重定向解析短链（163cn.tv 等），从 query/hash 提取歌曲 id
 *   3. 调 api/v3/song/detail 取元数据（歌名/歌手/专辑/封面）
 *   4. 失败兜底：og:image 封面 + 从分享文本解析《歌名》/分享{歌手}
 */
import { putMedia } from './media';
import { env } from 'cloudflare:workers';

export interface NcmSong {
  id: number;
  title: string;
  artist: string;
  album: string;
  cover: string; // 封面（本站 /media/... 或 126.net 外链）
  songUrl: string;
}

export type ResolveResult =
  | { ok: true; song: NcmSong }
  | { ok: false; error: string; fallback?: { title: string; artist: string } };

/** 从分享文本提取 URL。 */
export function extractShareUrl(text: string): string | null {
  const match = text.match(/https?:\/\/[^\s"'<>（）()]+/);
  return match ? match[0].replace(/[，。；]$/, '') : null;
}

/** 跟随重定向，从最终 URL 提取歌曲 id（query 或 hash 形式）。 */
export async function resolveSongId(rawUrl: string): Promise<number | null> {
  try {
    const resp = await fetch(rawUrl, {
      redirect: 'follow',
      headers: {
        'user-agent':
          'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
        accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'accept-language': 'zh-CN,zh;q=0.9',
        referer: 'https://music.163.com/',
      },
    });
    const finalUrl = resp.url || rawUrl;
    const id = parseIdFromUrl(finalUrl);
    if (id) return id;
    // 部分短链直接返回 302 但 fetch 已跟随；再兜底尝试 HTML 中的 song?id=
    const text = await resp.text();
    const m = text.match(/song\?id=(\d+)/) || text.match(/song%3Fid%3D(\d+)/);
    return m ? Number(m[1]) : null;
  } catch {
    return null;
  }
}

/** 从 URL（query 或 hash）解析歌曲 id。 */
export function parseIdFromUrl(url: string): number | null {
  const m = url.match(/[?&#]id=(\d+)/);
  return m ? Number(m[1]) : null;
}

/** 用网易云搜索 API 按「歌名 歌手」找歌曲 id（短链被边缘网络拦截时的兜底）。 */
export async function searchSongId(query: string): Promise<number | null> {
  try {
    const resp = await fetch(
      `https://music.163.com/api/search/get/web?s=${encodeURIComponent(query)}&type=1&limit=1`,
      { headers: { 'user-agent': 'Mozilla/5.0', referer: 'https://music.163.com/' } },
    );
    if (!resp.ok) return null;
    const data = (await resp.json()) as { result?: { songs?: { id?: number }[] } };
    const id = data.result?.songs?.[0]?.id;
    return typeof id === 'number' ? id : null;
  } catch {
    return null;
  }
}

/** 调 v3 song/detail 取元数据（无需登录）。 */
export async function fetchSongMeta(id: number): Promise<Partial<NcmSong> | null> {
  try {
    const resp = await fetch('https://music.163.com/api/v3/song/detail', {
      method: 'POST',
      headers: {
        'user-agent': 'Mozilla/5.0',
        referer: `https://music.163.com/song?id=${id}`,
        'content-type': 'application/x-www-form-urlencoded',
      },
      body: `c=${encodeURIComponent(JSON.stringify([{ id }]))}`,
    });
    if (!resp.ok) return null;
    const data = (await resp.json()) as {
      songs?: {
        name?: string;
        ar?: { name?: string }[];
        al?: { name?: string; picUrl?: string };
      }[];
    };
    const song = data.songs?.[0];
    if (!song) return null;
    return {
      id,
      title: song.name ?? '',
      artist:
        song.ar
          ?.map((a) => a.name ?? '')
          .filter(Boolean)
          .join(' / ') || '',
      album: song.al?.name ?? '',
      cover: song.al?.picUrl ?? '',
      songUrl: `https://music.163.com/#/song?id=${id}`,
    };
  } catch {
    return null;
  }
}

/** 从分享文本解析《歌名》与"分享{歌手}的"。 */
export function parseFromText(text: string): { title: string; artist: string } {
  const titleMatch = text.match(/《([^》]+)》/);
  const artistMatch = text.match(/分享(.+?)的(?:单曲|歌曲)/);
  return {
    title: titleMatch ? titleMatch[1] : '',
    artist: artistMatch ? artistMatch[1].trim() : '',
  };
}

/** 把封面 URL 下载并存入本站媒体库，返回本站 URL；失败返回原外链。 */
async function storeCover(coverUrl: string, ncmId: number): Promise<string> {
  try {
    const resp = await fetch(coverUrl, {
      headers: { 'user-agent': 'Mozilla/5.0', referer: 'https://music.163.com/' },
    });
    if (!resp.ok) return coverUrl;
    const bytes = new Uint8Array(await resp.arrayBuffer());
    const mime = resp.headers.get('content-type')?.split(';')[0] || 'image/jpeg';
    const ext = mime.includes('png') ? 'png' : mime.includes('webp') ? 'webp' : 'jpg';
    const key = `ncm-covers/${ncmId}.${ext}`;
    await putMedia(key, bytes, mime);
    return `/media/${key}`;
  } catch {
    return coverUrl;
  }
}

/** 完整解析入口：分享文本 → 歌曲信息（含封面入库）。 */
export async function resolveShare(text: string): Promise<ResolveResult> {
  const trimmed = text.trim();
  if (!trimmed) return { ok: false, error: '内容为空' };

  const textFallback = parseFromText(trimmed);
  const url = extractShareUrl(trimmed);

  // 1) 短链解析（部分边缘网络会被 163cn.tv 拦截）
  let id: number | null = null;
  if (url) id = await resolveSongId(url);

  // 2) 兜底：搜索 API 按「歌名 歌手」找 id
  if (!id && textFallback.title) {
    id = await searchSongId(`${textFallback.title} ${textFallback.artist}`.trim());
  }

  if (id) {
    const meta = await fetchSongMeta(id);
    if (meta && meta.title) {
      const cover = meta.cover ? await storeCover(meta.cover, id) : '';
      return {
        ok: true,
        song: {
          id,
          title: meta.title,
          artist: meta.artist || textFallback.artist,
          album: meta.album ?? '',
          cover,
          songUrl: `https://music.163.com/#/song?id=${id}`,
        },
      };
    }
    // 有 id 但元数据接口失败：用文本兜底信息
    if (textFallback.title) {
      return {
        ok: true,
        song: {
          id,
          title: textFallback.title,
          artist: textFallback.artist,
          album: '',
          cover: '',
          songUrl: `https://music.163.com/#/song?id=${id}`,
        },
      };
    }
  }

  // 3) 最后兜底：分享文本里的《歌名》+ 歌手
  if (textFallback.title) {
    return {
      ok: true,
      song: {
        id: 0,
        title: textFallback.title,
        artist: textFallback.artist,
        album: '',
        cover: '',
        songUrl: url ?? '',
      },
    };
  }

  return { ok: false, error: '无法解析链接，请手动填写歌名/歌手' };
}

/** 按关键词（歌名/歌手）搜索歌曲（供 App「搜索」入口）。封面一并入库。 */
export async function resolveByQuery(query: string): Promise<ResolveResult> {
  const trimmed = query.trim();
  if (!trimmed) return { ok: false, error: '内容为空' };

  const id = await searchSongId(trimmed);
  if (!id) return { ok: false, error: '没有找到匹配的歌曲，请换关键词试试' };

  const meta = await fetchSongMeta(id);
  if (!meta || !meta.title) {
    return { ok: false, error: '找到歌曲但获取信息失败，请稍后再试' };
  }

  const cover = meta.cover ? await storeCover(meta.cover, id) : '';
  return {
    ok: true,
    song: {
      id,
      title: meta.title,
      artist: meta.artist ?? '',
      album: meta.album ?? '',
      cover,
      songUrl: `https://music.163.com/#/song?id=${id}`,
    },
  };
}

/** 便捷：按歌曲 id 解析（供后端直接使用）。 */
export function getNcmEnv(): { owner: string; repo: string } {
  return { owner: env.GITHUB_OWNER || 'lordestar', repo: env.GITHUB_REPO || 'lordestar-media' };
}
