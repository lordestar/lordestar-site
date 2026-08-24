import { env } from 'cloudflare:workers';

/**
 * GitHub 媒体库共用模块：上传字节到媒体仓库、读取媒体内容。
 * 元数据（mime）存 KV，文件本体存 GitHub（public 仓库，raw 直读）。
 */

export function ghConfig(): { owner: string; repo: string; branch: string } {
  return {
    owner: env.GITHUB_OWNER || 'lordestar',
    repo: env.GITHUB_REPO || 'lordestar-media',
    branch: env.GITHUB_BRANCH || 'main',
  };
}

function ghHeaders(): Record<string, string> {
  return {
    Authorization: `Bearer ${env.GITHUB_TOKEN}`,
    'content-type': 'application/json',
    'user-agent': 'lordestar-site',
    'x-github-api-version': '2022-11-28',
  };
}

function bytesToBase64(bytes: Uint8Array): string {
  let binary = '';
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunk));
  }
  return btoa(binary);
}

/** 把字节写入 GitHub 媒体仓库（幂等：文件已存在则更新），并把 mime 元数据写入 KV。 */
export async function putMedia(key: string, bytes: Uint8Array, mime: string): Promise<void> {
  const { owner, repo, branch } = ghConfig();
  const token = env.GITHUB_TOKEN;
  if (!token) throw new Error('媒体库未配置（缺少 GITHUB_TOKEN）');

  // 文件已存在时，Contents API 更新需要携带当前 sha（幂等更新而非冲突）
  let sha: string | undefined;
  const exists = await fetch(`https://api.github.com/repos/${owner}/${repo}/contents/${key}`, {
    headers: ghHeaders(),
  });
  if (exists.ok) {
    try {
      sha = ((await exists.json()) as { sha?: string }).sha;
    } catch {
      sha = undefined;
    }
  }

  const resp = await fetch(`https://api.github.com/repos/${owner}/${repo}/contents/${key}`, {
    method: 'PUT',
    headers: ghHeaders(),
    body: JSON.stringify({
      message: `upload ${key}`,
      content: bytesToBase64(bytes),
      branch,
      ...(sha ? { sha } : {}),
    }),
  });
  if (!resp.ok) {
    const detail = (await resp.text()).slice(0, 200);
    throw new Error(`GitHub 上传失败 (${resp.status}): ${detail}`);
  }

  const kv = env.MEDIA_KV as KVNamespace | undefined;
  if (kv) {
    await kv.put(`${key}#meta`, JSON.stringify({ mime, size: bytes.byteLength }));
  }
}

/** 从媒体库读取内容，返回 Response（404 表示不存在）。 */
export async function getMedia(key: string): Promise<Response> {
  const { owner, repo, branch } = ghConfig();

  const kv = env.MEDIA_KV as KVNamespace | undefined;
  let mime = 'application/octet-stream';
  if (kv) {
    const meta = await kv.get(`${key}#meta`, { type: 'json' }).catch(() => null);
    if (meta && typeof meta === 'object' && 'mime' in meta) mime = String(meta.mime);
  }

  const resp = await fetch(`https://raw.githubusercontent.com/${owner}/${repo}/${branch}/${key}`);
  if (!resp.ok) return new Response('Not found', { status: 404 });

  return new Response(resp.body, {
    headers: {
      'content-type': mime,
      'cache-control': 'public, max-age=31536000, immutable',
    },
  });
}
