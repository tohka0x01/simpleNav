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

    const title = body.title != null ? String(body.title).trim() : undefined;
    const url = body.url != null ? String(body.url).trim() : undefined;
    const description = body.description != null ? String(body.description).trim() : undefined;
    const category = body.category != null ? String(body.category).trim() : undefined;

    const raw = (await SITES.get('sites')) || '[]';
    const sites = JSON.parse(raw);
    const idx = sites.findIndex(s => s && s.id === id);
    if (idx === -1) return new Response('not_found', { status: 404 });

    // validate category exists if provided
    if (category !== undefined) {
      const catsRaw = (await SITES.get('categories')) || '[]';
      let cats;
      try { cats = JSON.parse(catsRaw) || []; } catch { cats = []; }
      const names = Array.isArray(cats)
        ? cats.map(c => (typeof c === 'string' ? c : String(c?.name || ''))).filter(Boolean)
        : [];
      if (category && !names.includes(category)) return new Response('unknown_category', { status: 400 });
    }

    // if url changed ensure unique
    if (url && url !== sites[idx].url) {
      if (sites.some((s, i) => i !== idx && s && s.url === url)) return new Response('conflict', { status: 409 });
    }

    if (title !== undefined) sites[idx].title = title;
    if (url !== undefined) sites[idx].url = url;
    if (description !== undefined) sites[idx].description = description;
    if (category !== undefined) sites[idx].category = category;

    await SITES.put('sites', JSON.stringify(sites));
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

