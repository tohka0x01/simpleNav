import { defineConfig, type Plugin } from 'vite';
import vue from '@vitejs/plugin-vue';

function devApiMockPlugin(): Plugin {
  // In-memory KV mock; cleared on server restart
  type Site = { id:string; title:string; url:string; description?:string; isPublic?:boolean; clicks?:number; category?:string };
  type Category = { name:string; desc?:string };
  let sites: Site[] = [];
  let categories: Category[] = [];

  async function readJson(req: any): Promise<any> {
    return await new Promise((resolve, reject) => {
      let buf = '';
      req.on('data', (c: any) => (buf += c));
      req.on('end', () => {
        try { resolve(buf ? JSON.parse(buf) : {}); } catch (e) { reject(e); }
      });
      req.on('error', reject);
    });
  }

  function send(res: any, data: any, status = 200) {
    res.statusCode = status;
    res.setHeader('content-type', 'application/json; charset=utf-8');
    res.setHeader('cache-control', 'no-store');
    res.end(typeof data === 'string' ? data : JSON.stringify(data));
  }

  return {
    name: 'dev-api-mock',
    apply: 'serve',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        const url = req.url || '';
        if (!url.startsWith('/api/sites/') && !url.startsWith('/api/categories/')) return next();

        const full = new URL(req.url!, 'http://localhost');

        try {
          if (full.pathname === '/api/sites/list' && req.method === 'GET') {
            return send(res, sites);
          }
          if (full.pathname === '/api/sites/public' && req.method === 'GET') {
            // 私有功能取消：直接返回所有站点
            return send(res, { sites });
          }
          if (full.pathname === '/api/sites/add' && req.method === 'POST') {
            const body = await readJson(req);
            const title = String(body.title || '').trim();
            const urlv = String(body.url || '').trim();
            if (!title || !urlv) return send(res, 'bad_request', 400);
            const description = String(body.description || '').trim();
            const category = String(body.category || '').trim();
            const isPublic = body.isPublic !== false;
            if (category && !categories.some(c => c.name === category)) return send(res, 'unknown_category', 400);
            const id = (body.id && String(body.id).trim()) || `${Date.now().toString(36)}${Math.random().toString(36).slice(2,8)}`;
            if (sites.some(s => s.id === id || s.url === urlv)) return send(res, 'conflict', 409);
            sites.push({ id, title, url: urlv, description, category, isPublic, clicks: 0 });
            return send(res, { ok: true, id });
          }
          if (full.pathname === '/api/sites/click' && req.method === 'POST') {
            const body = await readJson(req);
            const id = String(body.id || '').trim();
            if (!id) return send(res, 'bad_request', 400);
            const idx = sites.findIndex(s => s && s.id === id);
            if (idx === -1) return send(res, 'not_found', 404);
            sites[idx].clicks = (sites[idx].clicks || 0) + 1;
            return send(res, { ok: true, clicks: sites[idx].clicks });
          }
          if (full.pathname === '/api/sites/update' && req.method === 'POST') {
            const body = await readJson(req);
            const id = String(body.id || '').trim();
            if (!id) return send(res, 'bad_request', 400);
            const idx = sites.findIndex(s => s && s.id === id);
            if (idx === -1) return send(res, 'not_found', 404);
            const title = body.title != null ? String(body.title).trim() : undefined;
            const urlv = body.url != null ? String(body.url).trim() : undefined;
            const description = body.description != null ? String(body.description).trim() : undefined;
            const category = body.category != null ? String(body.category).trim() : undefined;
            if (category !== undefined && category && !categories.some(c => c.name === category)) return send(res, 'unknown_category', 400);
            if (urlv && urlv !== sites[idx].url && sites.some((s, i) => i !== idx && s.url === urlv)) return send(res, 'conflict', 409);
            if (title !== undefined) sites[idx].title = title;
            if (urlv !== undefined) sites[idx].url = urlv;
            if (description !== undefined) sites[idx].description = description;
            if (category !== undefined) sites[idx].category = category;
            return send(res, { ok: true });
          }
          if (full.pathname === '/api/sites/delete' && req.method === 'POST') {
            const body = await readJson(req);
            const id = String(body.id || '').trim();
            if (!id) return send(res, 'bad_request', 400);
            const before = sites.length;
            sites = sites.filter(s => s && s.id !== id);
            if (sites.length === before) return send(res, 'not_found', 404);
            return send(res, { ok: true });
          }
          // categories endpoints
          if (full.pathname === '/api/categories/list' && req.method === 'GET') {
            return send(res, { categories });
          }
          if (full.pathname === '/api/categories/add' && req.method === 'POST') {
            const body = await readJson(req);
            const name = String(body.name || '').trim();
            const desc = String(body.desc || '').trim();
            if (!name) return send(res, 'bad_request', 400);
            const existed = categories.find(c => c.name === name);
            if (existed) {
              if (desc) existed.desc = desc;
            } else {
              categories.push({ name, desc });
            }
            return send(res, { ok: true });
          }
          if (full.pathname === '/api/categories/update' && req.method === 'POST') {
            const body = await readJson(req);
            const name = String(body.name || '').trim();
            const newName = body.newName != null ? String(body.newName).trim() : '';
            const desc = body.desc != null ? String(body.desc).trim() : undefined;
            if (!name) return send(res, 'bad_request', 400);
            const idx = categories.findIndex(c => c.name === name);
            if (idx === -1) return send(res, 'not_found', 404);
            if (newName && newName !== name) {
              if (categories.some(c => c.name === newName)) return send(res, 'conflict', 409);
              categories[idx].name = newName;
              // sync sites
              for (const s of sites) {
                if (s.category === name) s.category = newName;
              }
            }
            if (typeof desc === 'string') categories[idx].desc = desc;
            return send(res, { ok: true });
          }
          if (full.pathname === '/api/categories/delete' && req.method === 'POST') {
            const body = await readJson(req);
            const name = String(body.name || '').trim();
            if (!name) return send(res, 'bad_request', 400);
            const before = categories.length;
            categories = categories.filter(c => c.name !== name);
            if (categories.length === before) return send(res, 'not_found', 404);
            for (const s of sites) {
              if (s.category === name) s.category = '';
            }
            return send(res, { ok: true });
          }
          // Method not matched
          return send(res, 'not_found', 404);
        } catch (e) {
          return send(res, 'server_error', 500);
        }
      });
    }
  };
}

export default defineConfig({
  plugins: [vue(), devApiMockPlugin()],
  server: {
    port: 5173
  },
  build: {
    outDir: 'dist'
  }
});


