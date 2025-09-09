export async function onRequest({ request, env }) {
  try {
    if (request.method !== 'POST') return new Response('method_not_allowed', { status: 405 });
    if (!isAuthorized(request, env)) return new Response('unauthorized', { status: 401 });

    const body = await request.json();
    const name = String(body.name || '').trim();
    const newName = body.newName != null ? String(body.newName).trim() : '';
    const desc = body.desc != null ? String(body.desc).trim() : undefined;
    const updateSites = body.updateSites !== false; // default true
    if (!name) return new Response('bad_request', { status: 400 });

    const raw = (await env.SITES.get('categories')) || '[]';
    let categories;
    try { categories = JSON.parse(raw) || []; } catch { categories = []; }
    if (!Array.isArray(categories)) return new Response('server_error', { status: 500 });
    // normalize to objects
    categories = categories.map(c => typeof c === 'string' ? { name: c, desc: '' } : { name: String(c?.name || ''), desc: String(c?.desc || '') });

    const idx = categories.findIndex(c => c.name === name);
    if (idx === -1) return new Response('not_found', { status: 404 });

    // handle rename
    if (newName && newName !== name) {
      if (categories.some(c => c.name === newName)) return new Response('conflict', { status: 409 });
      categories[idx].name = newName;
      if (updateSites) {
        const sitesRaw = (await env.SITES.get('sites')) || '[]';
        let sites;
        try { sites = JSON.parse(sitesRaw) || []; } catch { sites = []; }
        if (Array.isArray(sites)) {
          let changed = false;
          for (const s of sites) {
            if (s && s.category === name) { s.category = newName; changed = true; }
          }
          if (changed) await env.SITES.put('sites', JSON.stringify(sites));
        }
      }
    }
    if (typeof desc === 'string') categories[idx].desc = desc;

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

