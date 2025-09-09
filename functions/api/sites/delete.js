export async function onRequest({ request, env }) {
  try {
    const { SITES } = env;
    if (request.method !== 'POST') {
      return new Response('method_not_allowed', { status: 405 });
    }
    if (!isAuthorized(request, env)) return new Response('unauthorized', { status: 401 });

    const body = await request.json();
    const id = String(body.id || '').trim();
    if (!id) return new Response('bad_request', { status: 400 });

    const raw = (await SITES.get('sites')) || '[]';
    const sites = JSON.parse(raw);
    const next = sites.filter(s => s && s.id !== id);
    if (next.length === sites.length) return new Response('not_found', { status: 404 });
    await SITES.put('sites', JSON.stringify(next));
    return new Response(JSON.stringify({ ok: true }), { headers: { 'content-type': 'application/json' } });
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

