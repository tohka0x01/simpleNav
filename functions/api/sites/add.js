export async function onRequest({ request, env }) {
  try {
    const { SITES } = env;
    if (request.method !== 'POST') {
      return new Response('method_not_allowed', { status: 405 });
    }
    if (!isAuthorized(request, env)) return new Response('unauthorized', { status: 401 });
    const body = await request.json();
    const title = (body.title || '').trim();
    const url = (body.url || '').trim();
    const description = (body.description || '').trim();
    const isPublic = body.isPublic !== false; // default true
    const category = (body.category || '').trim();
    if (!title || !url) return new Response('bad_request', { status: 400 });

    // enforce category exists if provided (supports string[] or {name,desc}[])
    if (category) {
      const catsRaw = (await SITES.get('categories')) || '[]';
      let cats;
      try { cats = JSON.parse(catsRaw) || []; } catch { cats = []; }
      const names = Array.isArray(cats)
        ? cats.map(c => (typeof c === 'string' ? c : String(c?.name || ''))).filter(Boolean)
        : [];
      if (!names.includes(category)) {
        return new Response('unknown_category', { status: 400 });
      }
    }

    const raw = (await SITES.get('sites')) || '[]';
    const sites = JSON.parse(raw);
    const id = body.id && String(body.id).trim() ? String(body.id).trim() : crypto.randomUUID();
    const exists = sites.some(s => s && (s.id === id || s.url === url));
    if (exists) return new Response('conflict', { status: 409 });
    sites.push({ id, title, url, description, isPublic, clicks: 0, category });
    await SITES.put('sites', JSON.stringify(sites));
    return new Response(JSON.stringify({ ok: true, id }), { headers: { 'content-type': 'application/json' } });
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


