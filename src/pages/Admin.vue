<template>
  <div class="admin container">
    <!-- Admin key gate overlay -->
    <div v-if="!adminKey" class="key-gate" tabindex="-1">
      <div class="key-card" role="dialog" aria-modal="true">
        <h2 class="key-title">管理员密钥</h2>
        <p class="key-sub">请输入密钥以进入管理后台</p>
        <div class="key-field">
          <input :type="showKey ? 'text' : 'password'"
                 v-model.trim="pendingKey"
                 placeholder="输入密钥..."
                 @keydown.enter="verifyKey"
                 autofocus />
          <button class="icon-btn small" type="button" @click="showKey = !showKey" :aria-label="showKey ? '隐藏密钥' : '显示密钥'">{{ showKey ? '🙈' : '👁️' }}</button>
        </div>
        <div class="key-actions">
          <button class="btn primary" :disabled="verifying || !pendingKey" @click="verifyKey">{{ verifying ? '验证中…' : '进入' }}</button>
          <button class="btn" v-if="hasStoredKey" type="button" @click="clearKey">清除已保存</button>
          <span class="msg" :class="{ ok: verifyOk, err: verifyErr }">{{ verifyErr || verifyOk }}</span>
        </div>
      </div>
    </div>
    <div class="toolbar">
      <div>
        <h2 class="page-title">站点管理</h2>
        <p class="sub">需要密钥才能管理（通过首页右上角⚙️验证）</p>
      </div>
      <div class="actions">
        <button class="btn" @click="openCategory">📂 分类管理</button>
        <button class="btn primary" @click="openAdd">➕ 添加站点</button>
      </div>
    </div>

    <section class="panel">
      <div class="panel-head">
        <h3 class="panel-title">所有站点</h3>
        <div class="tools">
          <input class="input" v-model.trim="q" placeholder="按标题/URL/描述筛选" />
          <FancySelect v-model="cat" :options="catOptions" placeholder="全部分类" />
          <button class="btn" @click="load" :disabled="loadingList">刷新</button>
        </div>
      </div>

      <div class="summary">
        <span>总数: {{ list.length }}</span>
      </div>

      <div v-if="error" class="empty">{{ error }}</div>
      <div v-else>
        <div v-if="filtered.length===0" class="empty">暂无数据或未匹配</div>
        <div v-else class="table">
          <div class="thead">
            <div>标题</div>
            <div>分类</div>
            <div>点击</div>
            <div>操作</div>
          </div>
          <div class="tbody">
            <div v-for="s in filtered" :key="s.id" class="row" @dblclick="openEdit(s)">
              <div class="cell title">
                <div class="t">{{ s.title }}</div>
                <div class="desc" v-if="s.description">{{ s.description }}</div>
              </div>
              <div class="cell">
                <span class="chip" v-if="s.category">{{ s.category }}</span>
                <span class="chip muted" v-else>未分类</span>
              </div>
              <div class="cell">{{ s.clicks || 0 }}</div>
              <div class="cell actions">
                <div class="row-tools">
                  <button class="btn" @click.stop="openEdit(s)">编辑</button>
                  <button class="btn" @click.stop="removeSite(s)">删除</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- 添加站点 -->
    <div v-if="showAdd" class="modal" @keydown.esc="closeAdd" tabindex="-1">
      <div class="backdrop" @click="closeAdd" />
      <div class="card" role="dialog" aria-modal="true">
        <div class="card-head">
          <h3>{{ isEditing ? '编辑站点' : '添加站点' }}</h3>
          <button class="icon-btn" @click="closeAdd" aria-label="关闭">✕</button>
        </div>
        <form @submit.prevent="submit" class="modal-form">
          <label>标题<input v-model.trim="title" placeholder="例：Google" required /></label>
          <label>网址<input v-model.trim="url" placeholder="https://example.com" required /></label>
          <label>分类
            <FancySelect v-model="category" :disabled="categories.length===0" :options="categoryNames" placeholder="请选择分类" />
            <small v-if="categories.length===0" class="muted-info">请先关闭本框，打开“分类管理”新增。</small>
          </label>
          <label>描述<textarea v-model.trim="description" rows="3" placeholder="可选"></textarea></label>
          
          <div class="modal-actions">
            <button class="btn" type="button" @click="closeAdd" :disabled="loading">取消</button>
            <button class="btn primary" :disabled="loading || !category">{{ loading ? '提交中…' : (isEditing ? '保存' : '添加') }}</button>
            <span class="msg" :class="{ ok: okMsg, err: errMsg }">{{ okMsg || errMsg }}</span>
          </div>
        </form>
      </div>
    </div>

    <!-- 分类管理 -->
    <div v-if="showCat" class="modal" @keydown.esc="closeCategory" tabindex="-1">
      <div class="backdrop" @click="closeCategory" />
      <div class="card" role="dialog" aria-modal="true">
        <div class="card-head">
          <h3>{{ isEditing ? '编辑站点' : '添加站点' }}</h3>
          <button class="icon-btn" @click="closeCategory" aria-label="关闭">✕</button>
        </div>
        <div class="modal-form">
          <label>分类名<input v-model.trim="categoryName" placeholder="如：学习 / 工具 / 工作" /></label>
          <label>分类简介<input v-model.trim="categoryDesc" placeholder="如：自用工具 / 效率提升" /></label>
          <div class="modal-actions">
            <button class="btn" type="button" @click="closeCategory">关闭</button>
            <button class="btn primary" type="button" @click="saveCategory" :disabled="!categoryName">添加</button>
          </div>

          <div class="cat-list">
            <div v-for="c in categories" :key="c.name" class="cat-item">
              <template v-if="editingName===c.name">
                <input class="input" v-model.trim="editName" />
                <input class="input" v-model.trim="editDesc" />
                <button class="btn primary" @click="applyEdit">保存</button>
                <button class="btn" @click="cancelEdit">取消</button>
              </template>
              <template v-else>
                <div class="cat-main">
                  <span class="cat-name">{{ c.name }}</span>
                  <span class="cat-desc" v-if="c.desc">{{ c.desc }}</span>
                </div>
                <div class="cat-actions">
                  <button class="btn" @click="startEdit(c)">编辑</button>
                  <button class="btn" @click="removeCategory(c.name)">删除</button>
                </div>
              </template>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import FancySelect from '../ui/FancySelect.vue';

type Site = { id:string; title:string; url:string; description?:string; isPublic?:boolean; clicks?:number; category?:string };
type Category = { name:string; desc?:string };

// 添加站点弹窗
const showAdd = ref(false);
const showCat = ref(false);
const title = ref('');
const url = ref('');
const description = ref('');
const category = ref('');
const loading = ref(false);
const okMsg = ref('');
const errMsg = ref('');
const isEditing = ref(false);
const currentId = ref('');

// 分类管理
const categoryName = ref('');
const categoryDesc = ref('');
const categories = ref<Category[]>([]);
const editingName = ref('');
const editName = ref('');
const editDesc = ref('');

const adminKey = ref<string>(localStorage.getItem('admin_key') || '');
const pendingKey = ref<string>('');
const verifying = ref(false);
const verifyErr = ref('');
const verifyOk = ref('');
const showKey = ref(false);
const hasStoredKey = computed(()=> !!localStorage.getItem('admin_key'));
function authHeaders(extra: Record<string,string> = {}){
  const h: Record<string,string> = { ...extra };
  if(adminKey.value){ h['Authorization'] = `Bearer ${adminKey.value}`; }
  return h;
}

async function verifyKey(){
  verifyErr.value = '';
  verifyOk.value = '';
  if(!pendingKey.value) return;
  verifying.value = true;
  try{
    const res = await fetch('/api/auth/verify', { headers: { Authorization: `Bearer ${pendingKey.value}` }, cache: 'no-store' });
    if(res.ok){
      adminKey.value = pendingKey.value;
      localStorage.setItem('admin_key', pendingKey.value);
      verifyOk.value = '验证成功';
      await load();
      await loadCategories();
    }else{
      verifyErr.value = '密钥错误或未授权';
    }
  }catch{
    verifyErr.value = '网络错误，请稍后重试';
  }finally{
    verifying.value = false;
  }
}

function clearKey(){
  localStorage.removeItem('admin_key');
  adminKey.value = '';
  pendingKey.value = '';
  verifyErr.value = '';
  verifyOk.value = '';
}

function resetForm(){
  title.value = '';
  url.value = '';
  description.value = '';
  category.value = '';
  okMsg.value = '';
  errMsg.value = '';
}

function openAdd(){ isEditing.value=false; currentId.value=''; showAdd.value = true; okMsg.value=''; errMsg.value=''; }
function closeAdd(){ showAdd.value = false; isEditing.value=false; currentId.value=''; }

function openCategory(){ categoryName.value=''; categoryDesc.value=''; showCat.value = true; }
function closeCategory(){ showCat.value = false; editingName.value=''; }

function openEdit(s){
  isEditing.value = true;
  currentId.value = s.id;
  title.value = s.title || '';
  url.value = s.url || '';
  description.value = s.description || '';
  category.value = s.category || '';
  okMsg.value=''; errMsg.value='';
  showAdd.value = true;
}

async function removeSite(s){
  if(!confirm(`确认删除站点 “${s.title}”？`)) return;
  try{
    await fetch('/api/sites/delete', { method:'POST', headers: authHeaders({ 'content-type':'application/json' }), body: JSON.stringify({ id: s.id }) });
    await load();
  }catch{}
}
async function saveCategory(){
  if(!categoryName.value) return;
  try{
    await fetch('/api/categories/add', { method:'POST', headers: authHeaders({ 'content-type':'application/json' }), body: JSON.stringify({ name: categoryName.value, desc: categoryDesc.value }) });
    await loadCategories();
    category.value = categoryName.value;
    categoryName.value = '';
    categoryDesc.value = '';
  }catch{}
}

function startEdit(c:Category){ editingName.value = c.name; editName.value = c.name; editDesc.value = c.desc || ''; }
function cancelEdit(){ editingName.value=''; editName.value=''; editDesc.value=''; }
async function applyEdit(){
  if(!editingName.value) return;
  try{
    await fetch('/api/categories/update', { method:'POST', headers: authHeaders({ 'content-type':'application/json' }), body: JSON.stringify({ name: editingName.value, newName: editName.value, desc: editDesc.value }) });
    await loadCategories();
  }finally{ cancelEdit(); }
}
async function removeCategory(name:string){
  if(!confirm(`确定删除分类 “${name}” ？已归属该分类的站点将变为未分类。`)) return;
  try{
    await fetch('/api/categories/delete', { method:'POST', headers: authHeaders({ 'content-type':'application/json' }), body: JSON.stringify({ name }) });
    await loadCategories();
    if(category.value===name) category.value='';
    if(cat.value===name) cat.value='全部';
  }catch{}
}

// 列表与筛选
const list = ref<Site[]>([]);
const loadingList = ref(false);
const error = ref('');
const q = ref('');
const cat = ref('全部');
const categoryNames = computed(()=> categories.value.map(c=>c.name));
const catOptions = computed(()=> ['全部', ...categoryNames.value]);

const filtered = computed(()=>{
  const term = q.value.toLowerCase();
  return list.value.filter(s=>{
    if(cat.value !== '全部' && s.category !== cat.value) return false;
    if(term){
      const inTitle = (s.title||'').toLowerCase().includes(term);
      const inUrl = (s.url||'').toLowerCase().includes(term);
      const inDesc = (s.description||'').toLowerCase().includes(term);
      if(!(inTitle||inUrl||inDesc)) return false;
    }
    return true;
  }).sort((a,b)=> (b.clicks||0)-(a.clicks||0) || String(a.title||'').localeCompare(String(b.title||'')));
});

async function load(){
  error.value='';
  loadingList.value = true;
  try{
    const res = await fetch('/api/sites/list', { cache:'no-store', headers: authHeaders() });
    if(!res.ok){ error.value='无法加载，未授权或密钥错误'; list.value=[]; return; }
    const data = await res.json();
    list.value = Array.isArray(data) ? data : [];
  }catch{
    error.value='加载失败';
    list.value=[];
  }finally{
    loadingList.value = false;
  }
}

async function loadCategories(){
  try{
    const res = await fetch('/api/categories/list', { cache:'no-store' });
    const data = await res.json();
    const list = Array.isArray(data?.categories) ? data.categories : [];
    categories.value = list.map((c:any)=>({ name: String(c?.name || c), desc: String(c?.desc || '') }));
  }catch{ categories.value = []; }
}

async function submit(){
  loading.value = true; okMsg.value=''; errMsg.value='';
  try{
    const payload = { title: title.value, url: url.value, description: description.value, category: category.value } as any;
    const endpoint = isEditing.value ? '/api/sites/update' : '/api/sites/add';
    if(isEditing.value) payload.id = currentId.value;
    
    const res = await fetch(endpoint, { method:'POST', headers: authHeaders({ 'content-type':'application/json' }), body: JSON.stringify(payload) });
    if(res.ok){ okMsg.value='已添加'; resetForm(); await load(); closeAdd(); }
    else if(res.status===409){ errMsg.value='已存在，可能 URL/ID 冲突'; }
    else if(res.status===400){ errMsg.value='参数无效，请先添加分类并选择'; }
    else if(res.status===401||res.status===403){ errMsg.value='未授权或被拒绝'; }
    else { errMsg.value='提交失败'; }
  }catch{ errMsg.value='网络错误'; }
  finally{ loading.value=false; }
}

onMounted(async ()=>{
  if(!adminKey.value){
    const k = window.prompt('请输入管理密钥');
    if(k){ adminKey.value = k; localStorage.setItem('admin_key', k); }
    if(!adminKey.value) return;
  }
  await load();
  await loadCategories();
});
</script>

<style scoped>
.admin{padding-bottom:40px}
.toolbar{display:flex;align-items:flex-end;justify-content:space-between;margin:6px 0 16px}
.toolbar .actions{display:flex;gap:10px;flex-wrap:nowrap;white-space:nowrap}
.page-title{font-size:1.6rem;margin:8px 0 6px}
.sub{color:var(--muted);margin-bottom:16px}
.panel{background:linear-gradient(180deg, var(--surface) 0%, var(--surface-2) 100%);border:1px solid var(--border);border-radius:16px;padding:18px}
.panel-title{margin:0 0 12px;font-weight:600}
.panel-head{display:flex;align-items:center;justify-content:space-between;margin-bottom:8px}
.tools{display:flex;gap:10px;flex-wrap:wrap}
.summary{display:flex;gap:14px;color:var(--muted);margin:6px 0 12px}

label{color:var(--muted);font-size:.9rem}
input,textarea,select{padding:10px 12px;border:1px solid var(--border);border-radius:10px;background:transparent;color:var(--text);outline:none}
input::placeholder,textarea::placeholder{color:#808892}
.input{padding:10px 12px;border:1px solid var(--border);border-radius:999px;background:transparent;color:var(--text)}
.btn{padding:10px 14px;border:1px solid var(--border);border-radius:12px;background:linear-gradient(180deg,#1a1f2a,#141824);color:var(--text);cursor:pointer;box-shadow:0 8px 20px rgba(0,0,0,.25)}
.btn.primary{border-color:var(--accent-weak);background:var(--accent);color:#0b1220}
.btn:disabled{opacity:.6;cursor:not-allowed}
.msg{margin-left:6px;font-size:.92rem}
.msg.ok{color:#34d399}.msg.err{color:#f87171}

/* table */
.table{width:100%;border:1px solid var(--border);border-radius:12px;overflow:hidden}
.thead,.row{display:grid;grid-template-columns:2.4fr 1.2fr .8fr 1.4fr;gap:0}
.thead{background:#0f1420;color:#9aa4b2;font-weight:600}
.thead > div{padding:10px 12px;border-right:1px solid var(--border)}
.tbody .row{border-top:1px solid var(--border)}
.cell{padding:12px;border-right:1px solid var(--border);display:flex;align-items:center}
.cell.title{display:block}
.cell.link a{color:var(--text);text-decoration:underline}
.t{font-weight:600}
.desc{color:var(--muted);margin-top:4px}
.chip{display:inline-block;padding:4px 8px;border:1px solid var(--border);border-radius:999px}
.chip.muted{opacity:.8}
.badge{display:inline-block;padding:4px 10px;border-radius:999px;border:1px solid var(--border)}
.badge.ok{background:rgba(34,197,94,.1);color:#34d399;border-color:rgba(34,197,94,.3)}
.badge.warn{background:rgba(234,88,12,.08);color:#fb923c;border-color:rgba(234,88,12,.25)}

.empty{color:var(--muted);padding:16px}

/* modal */
.modal{position:fixed;inset:0;z-index:1000;display:flex;align-items:center;justify-content:center}
.modal .backdrop{position:absolute;inset:0;background:rgba(0,0,0,.6);backdrop-filter:blur(2px)}
.modal .card{position:relative;width:min(820px,92vw);background:linear-gradient(180deg, #121720, #0e141c);border:1px solid var(--border);border-radius:16px;box-shadow:0 30px 80px rgba(0,0,0,.5);padding:18px}
.modal .card-head{display:flex;align-items:center;justify-content:space-between;margin-bottom:8px}
.icon-btn{border:1px solid var(--border);background:transparent;color:var(--text);border-radius:10px;padding:6px 10px;cursor:pointer}
.modal-form{display:flex;flex-direction:column;gap:12px}
.modal-form label{display:flex;flex-direction:column;gap:6px}
.modal-form .inline{flex-direction:row;align-items:center;gap:10px}
.modal-actions{display:flex;align-items:center;gap:10px;margin-top:4px}

/* category manager */
.cat-list{margin-top:10px;border-top:1px solid var(--border);padding-top:10px;display:flex;flex-direction:column;gap:8px}
.cat-item{display:flex;align-items:center;justify-content:space-between;gap:10px;border:1px solid var(--border);border-radius:10px;padding:10px;background:linear-gradient(180deg,#161b25,#0e141c)}
.cat-main{display:flex;flex-direction:column}
.cat-name{font-weight:600}
.cat-desc{color:var(--muted);margin-top:2px}
.cat-actions{display:flex;gap:8px}

/* row actions */
.row-tools{margin-top:6px;display:inline-flex;gap:8px;flex-wrap:nowrap;align-items:center;white-space:nowrap}
.row-tools .btn{padding:8px 12px}

/* admin key gate */
.key-gate{position:fixed;inset:0;z-index:2000;display:grid;place-items:center;background:radial-gradient(60% 60% at 50% 40%, rgba(106,166,255,.15), transparent 60%), linear-gradient(180deg, rgba(0,0,0,.65), rgba(0,0,0,.65))}
.key-card{width:min(520px,92vw);border:1px solid var(--border);border-radius:18px;background:linear-gradient(180deg, #141a26, #0e141c);box-shadow:0 30px 80px rgba(0,0,0,.5);padding:22px;backdrop-filter:blur(10px)}
.key-title{margin:0 0 6px;font-size:1.5rem;text-align:center}
.key-sub{margin:0 0 14px;color:var(--muted);text-align:center}
.key-field{display:flex;align-items:center;justify-content:center;gap:10px;margin-top:6px}
.key-field input{flex:0 1 360px;max-width:360px;width:100%;padding:12px 14px;border:1px solid var(--border);border-radius:14px;background:rgba(255,255,255,.04);color:var(--text);outline:none;transition:border-color .2s ease, box-shadow .2s ease}
.key-field input:focus{border-color:var(--accent-weak);box-shadow:0 0 0 3px rgba(99,102,241,.25)}
.icon-btn.small{padding:10px;border-radius:12px}
.key-actions{display:flex;align-items:center;justify-content:center;gap:10px;margin-top:14px}
</style>











