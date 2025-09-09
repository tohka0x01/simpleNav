export async function onRequest({ request, env }) {
  try {
    if (!isAuthorized(request, env)) return new Response('unauthorized', { status: 401 });
    const raw = (await env.SITES.get('sites')) || '[]';
    return new Response(raw, { headers: { 'content-type': 'application/json', 'cache-control': 'no-store' } });
  } catch (e) {
    return new Response('server_error', { status: 500 });
  }
}

function isAuthorized(request, env) {
  const header = request.headers.get('Authorization') || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : header;
  const key = (env.ADMIN_KEY || '').trim();
  if (!key) return false;
  return token && token === key;
}


