export interface Env {
  GITHUB_CLIENT_ID: string;
  GITHUB_CLIENT_SECRET: string;
}

const GITHUB_AUTHORIZE_URL = 'https://github.com/login/oauth/authorize';
const GITHUB_TOKEN_URL = 'https://github.com/login/oauth/access_token';

function htmlPage(title: string, script: string): Response {
  const body = `<!doctype html>
<html lang="zh-CN">
<head>
  <meta charset="utf-8" />
  <title>${title}</title>
</head>
<body>
  <script>${script}</script>
</body>
</html>`;
  return new Response(body, {
    headers: {
      'content-type': 'text/html; charset=utf-8',
      'cache-control': 'no-store',
    },
  });
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    if (request.method !== 'GET') {
      return new Response('Method not allowed', { status: 405 });
    }

    const url = new URL(request.url);
    const redirectUri = `${url.origin}/callback`;

    if (url.pathname === '/auth') {
      const params = new URLSearchParams({
        client_id: env.GITHUB_CLIENT_ID,
        redirect_uri: redirectUri,
        scope: 'repo',
      });
      const state = url.searchParams.get('state');
      if (state) params.set('state', state);
      return Response.redirect(`${GITHUB_AUTHORIZE_URL}?${params.toString()}`, 302);
    }

    if (url.pathname === '/callback') {
      const code = url.searchParams.get('code');
      const error = url.searchParams.get('error');
      if (error) {
        return htmlPage(
          'GitHub 授权失败',
          `document.write('<p>授权失败：${escapeHtml(error)}</p>');`,
        );
      }
      if (!code) {
        return htmlPage('GitHub 授权失败', "document.write('<p>缺少授权 code</p>');");
      }

      const tokenResponse = await fetch(GITHUB_TOKEN_URL, {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          accept: 'application/json',
        },
        body: JSON.stringify({
          client_id: env.GITHUB_CLIENT_ID,
          client_secret: env.GITHUB_CLIENT_SECRET,
          code,
          redirect_uri: redirectUri,
        }),
      });

      const data = (await tokenResponse.json()) as {
        access_token?: string;
        error?: string;
        error_description?: string;
      };

      if (!data.access_token) {
        const message = data.error_description || data.error || '未知错误';
        return htmlPage(
          'GitHub 授权失败',
          `document.write('<p>换取 token 失败：${escapeHtml(message)}</p>');`,
        );
      }

      const token = data.access_token;
      const payload = JSON.stringify({ token, provider: 'github' });
      return htmlPage(
        '授权成功',
        `if (window.opener) {
  window.opener.postMessage(${payload}, '*');
  window.close();
} else {
  document.write('<p>授权成功，请关闭此窗口。</p>');
}`,
      );
    }

    return htmlPage(
      'lordestar Decap OAuth',
      "document.write('<p>这是 lordestar 网站的 Decap CMS GitHub OAuth Worker。</p><p>访问 /auth 开始登录。</p>');",
    );
  },
};
