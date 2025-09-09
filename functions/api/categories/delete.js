export async function onRequest({ request, env }) {
  try {
    if (request.method !== 'POST') return new Response('method_not_allowed', { status: 405 });
    if (!isAuthorized(request, env)) return new Response('unauthorized', { status: 401 });

    const body = await request.json();
    const name = String(body.name || '').trim();
    if (!name) return new Response('bad_request', { status: 400 });

    const raw = (await env.SITES.get('categories')) || '[]';
    let categories;
    try { categories = JSON.parse(raw) || []; } catch { categories = []; }
    if (!Array.isArray(categories)) return new Response('server_error', { status: 500 });
    // normalize
    categories = categories.map(c => typeof c === 'string' ? { name: c, desc: '' } : { name: String(c?.name || ''), desc: String(c?.desc || '') });

    const next = categories.filter(c => c.name !== name);
    if (next.length === categories.length) return new Response('not_found', { status: 404 });
    await env.SITES.put('categories', JSON.stringify(next));

    // also clear this category from sites
    const sitesRaw = (await env.SITES.get('sites')) || '[]';
    let sites;
    try { sites = JSON.parse(sitesRaw) || []; } catch { sites = []; }
    if (Array.isArray(sites)) {
      let changed = false;
      for (const s of sites) {
        if (s && s.category === name) { s.category = ''; changed = true; }
      }
      if (changed) await env.SITES.put('sites', JSON.stringify(sites));
    }

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

