function htmlPage(title, message) {
  const safe = String(message).replace(/[&<>"']/g, (char) => {
    const entities = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;',
    };
    return entities[char];
  });
  return new Response(
    `<!doctype html><html lang="en"><head><meta charset="utf-8"><title>${title}</title></head><body><p>${safe}</p></body></html>`,
    {
      headers: {
        'content-type': 'text/html; charset=utf-8',
        'cache-control': 'no-store',
      },
    },
  );
}

export async function onRequestGet(context) {
  const url = new URL(context.request.url);
  const redirectUri = `${url.origin}/admin/oauth/callback`;
  const code = url.searchParams.get('code');
  const error = url.searchParams.get('error');

  if (error) {
    return htmlPage('GitHub authorization failed', `Authorization failed: ${error}`);
  }
  if (!code) {
    return htmlPage('GitHub authorization failed', 'Missing authorization code.');
  }

  const tokenResponse = await fetch('https://github.com/login/oauth/access_token', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      accept: 'application/json',
    },
    body: JSON.stringify({
      client_id: context.env.GITHUB_CLIENT_ID,
      client_secret: context.env.GITHUB_CLIENT_SECRET,
      code,
      redirect_uri: redirectUri,
    }),
  });
  const data = await tokenResponse.json();

  if (!data.access_token) {
    return htmlPage(
      'GitHub authorization failed',
      `Token exchange failed: ${data.error_description || data.error || 'unknown error'}`,
    );
  }

  const payload = JSON.stringify({ token: data.access_token, provider: 'github' });
  const body = `<!doctype html><html lang="en"><head><meta charset="utf-8"><title>Success</title></head><body><script>if (window.opener) { window.opener.postMessage(${payload}, '*'); window.close(); } else { document.write('<p>Authorization complete. You can close this window.</p>'); }</script></body></html>`;
  return new Response(body, {
    headers: {
      'content-type': 'text/html; charset=utf-8',
      'cache-control': 'no-store',
    },
  });
}
