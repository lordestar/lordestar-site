/**
 * lordestar.pages.dev 反向代理 → Cloudflare Worker
 *
 * 背景：国内网络无法直连 workers.dev（部分 Cloudflare IP 被封锁），
 * 而 pages.dev 可以。此函数把所有「非静态资源」的请求转发给 Worker，
 * Worker 负责 SSR + D1 查询，再把响应原样返回。
 *
 * 静态资源（/_astro/*、/about/ 预渲染页、/photos/* 等）由 Pages 直接提供，
 * 不会走到这里。
 *
 * 头规范化（重要）：浏览器看到的是 pages.dev，Worker 看到自己是 workers.dev，
 * 两者 origin 不同会让 Astro 的同源检查（checkOrigin）拦截所有 POST。
 * 因此把 Origin/Referer 改写成 Worker 自身的 origin —— 这是反向代理的标准做法，
 * 对 Worker 直连请求（非经本代理）的同源防护仍然有效。
 *
 * 注意：WORKER_ORIGIN 变更时需同步修改此文件。
 */
const WORKER_ORIGIN = 'https://lordestar.cn';

export async function onRequest(context) {
  const { request } = context;
  const url = new URL(request.url);

  const target = new URL(url.pathname + url.search, WORKER_ORIGIN);

  // 规范化转发头：Origin/Referer 指向 Worker 自身
  const headers = new Headers(request.headers);
  headers.set('Origin', WORKER_ORIGIN);
  const referer = headers.get('Referer');
  if (referer) {
    headers.set('Referer', referer.replace(url.origin, WORKER_ORIGIN));
  }

  const init = {
    method: request.method,
    headers,
    redirect: 'manual',
  };
  // 非 GET/HEAD 请求需要携带 body（表单提交、未来的上传等）
  if (request.method !== 'GET' && request.method !== 'HEAD') {
    init.body = await request.arrayBuffer();
  }

  const resp = await fetch(target, init);

  // 若 Worker 返回重定向（Location 指向 workers.dev），改写回本站域名
  const responseHeaders = new Headers(resp.headers);
  const location = responseHeaders.get('Location');
  if (location) {
    responseHeaders.set('Location', location.replace(WORKER_ORIGIN, url.origin));
  }

  return new Response(resp.body, {
    status: resp.status,
    statusText: resp.statusText,
    headers: responseHeaders,
  });
}
