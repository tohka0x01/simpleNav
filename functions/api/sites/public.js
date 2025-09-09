export async function onRequest(context) {
  try {
    const { SITES } = context.env;
    const raw = (await SITES.get('sites')) || '[]';
    /** @type {Array<{id:string,title:string,url:string,description?:string,isPublic?:boolean,clicks?:number,category?:string}>} */
    const sites = JSON.parse(raw);
    // 私有功能已取消：直接返回所有站点
    return new Response(JSON.stringify({ sites }), {
      headers: {
        'content-type': 'application/json; charset=utf-8',
        'cache-control': 'no-store'
      }
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: 'failed_to_load' }), { status: 500, headers: { 'content-type': 'application/json' } });
  }
}


