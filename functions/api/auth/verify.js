export async function onRequest({ request, env }) {
  try {
    const ok = isAuthorized(request, env);
    if (!ok) return new Response('unauthorized', { status: 401 });
    return new Response(JSON.stringify({ ok: true }), {
      headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' }
    });
  } catch (e) {
    return new Response('server_error', { status: 500 });
  }
}

function isAuthorized(request, env) {
  const header = request.headers.get('Authorization') || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : header;
  const key = (env.ADMIN_KEY || '').trim();
  if (!key) return false; // require key to be configured
  return token && token === key;
}

