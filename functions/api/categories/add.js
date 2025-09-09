export async function onRequest({ request, env }) {
  try {
    if (request.method !== 'POST') return new Response('method_not_allowed', { status: 405 });
    if (!isAuthorized(request, env)) return new Response('unauthorized', { status: 401 });
    const body = await request.json();
    const name = String(body.name || '').trim();
    const desc = String(body.desc || '').trim();
    if (!name) return new Response('bad_request', { status: 400 });
    const raw = (await env.SITES.get('categories')) || '[]';
    let categories;
    try { categories = JSON.parse(raw) || []; } catch { categories = []; }
    if (!Array.isArray(categories)) return new Response('server_error', { status: 500 });
    // migrate to objects
    if (categories.length > 0 && typeof categories[0] === 'string') {
      categories = categories.map(n => ({ name: String(n), desc: '' }));
    } else {
      categories = categories.map(c => ({ name: String(c?.name || c), desc: String(c?.desc || '') }));
    }
    const exists = categories.find(c => c.name === name);
    if (exists) {
      if (desc) exists.desc = desc;
    } else {
      categories.push({ name, desc });
    }
    await env.SITES.put('categories', JSON.stringify(categories));
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
