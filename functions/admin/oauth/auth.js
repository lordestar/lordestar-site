export async function onRequestGet(context) {
  const url = new URL(context.request.url);
  const redirectUri = `${url.origin}/admin/oauth/callback`;
  const params = new URLSearchParams({
    client_id: context.env.GITHUB_CLIENT_ID,
    redirect_uri: redirectUri,
    scope: 'repo',
  });
  const state = url.searchParams.get('state');
  if (state) params.set('state', state);
  return Response.redirect(`https://github.com/login/oauth/authorize?${params.toString()}`, 302);
}
