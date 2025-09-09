export async function onRequest({ env }) {
  try {
    const raw = (await env.SITES.get('categories')) || '[]';
    let categories = [];
    try { categories = JSON.parse(raw) || []; } catch { categories = []; }
    if (Array.isArray(categories)) {
      if (categories.length > 0 && typeof categories[0] === 'string') {
        categories = categories.map(name => ({ name, desc: '' }));
      } else {
        categories = categories.map(c => ({ name: String(c?.name || c), desc: String(c?.desc || '') }));
      }
    } else {
      categories = [];
    }
    return new Response(JSON.stringify({ categories }), {
      headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' }
    });
  } catch (e) {
    return new Response('server_error', { status: 500 });
  }
}
