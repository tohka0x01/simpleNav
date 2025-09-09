export async function onRequest({ request, env }) {
  try {
    const { SITES } = env;
    if (request.method !== 'POST') {
      return new Response('method_not_allowed', { status: 405 });
    }
    const { id } = await request.json();
    if (!id) return new Response('bad_request', { status: 400 });

    const raw = (await SITES.get('sites')) || '[]';
    const sites = JSON.parse(raw);
    const idx = sites.findIndex(s => s && s.id === id);
    if (idx === -1) return new Response('not_found', { status: 404 });
    sites[idx].clicks = (sites[idx].clicks || 0) + 1;
    await SITES.put('sites', JSON.stringify(sites));
    return new Response(JSON.stringify({ ok: true, clicks: sites[idx].clicks }), { headers: { 'content-type': 'application/json' } });
  } catch (e) {
    return new Response('server_error', { status: 500 });
  }
}


