<template>
  <div>
    <SearchBar @submit="onSearch" />
    <CategoryTabs :categories="categoryNames" :active="active" @select="setActive" />
    <SitesGrid :title="sectionTitle" :sites="sortedSites" @open="onOpen" />
  </div>
  
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue';
import SearchBar from '../ui/SearchBar.vue';
import CategoryTabs from '../ui/CategoryTabs.vue';
import SitesGrid from '../ui/SitesGrid.vue';

type Site = { id:string; title:string; url:string; description?:string; clicks?:number; category?:string };
type Category = { name: string; desc?: string };

const categories = ref<Category[]>([]);
const active = ref<string>(''); // category name
const sites = ref<Site[]>([]);

const categoryNames = computed(()=> categories.value.map(c=>c.name));
const sortedSites = computed(()=>{
  const list = active.value ? sites.value.filter(s=>s.category===active.value) : [];
  return [...list].sort((a,b)=> (b.clicks||0)-(a.clicks||0) || String(a.title||'').localeCompare(String(b.title||'')));
});

const sectionTitle = computed(()=>{
  const c = categories.value.find(c=>c.name===active.value);
  return (c?.desc && c.desc.trim()) || c?.name || 'My Sites';
});

function onSearch(engine:{ url:string }, q:string){
  if(!q) return;
  const target = engine.url + encodeURIComponent(q);
  window.open(target, '_blank', 'noopener');
}

function setActive(c:string){
  active.value = c;
}

async function loadCategories(){
  try{
    const res = await fetch('/api/categories/list', { cache: 'no-store' });
    const data = await res.json();
    const list = Array.isArray(data?.categories) ? data.categories : [];
    categories.value = list.map((c:any)=>({ name: String(c?.name || c), desc: String(c?.desc || '') }));
  }catch{ categories.value = []; }
}

async function loadSites(){
  try{
    const res = await fetch(`/api/sites/public`, { cache: 'no-store' });
    let list: Site[] = [];
    if(res.ok){
      const data = await res.json();
      list = Array.isArray(data.sites) ? data.sites : [];
    }
    sites.value = list;
  }catch{
    sites.value = [];
  }
}

async function onOpen(site:Site){
  try{ await fetch('/api/sites/click', { method:'POST', headers:{'content-type':'application/json'}, body: JSON.stringify({ id: site.id }) }); }catch{}
  window.open(site.url, '_blank', 'noopener');
}

watch(categories, (cs)=>{
  const names = cs.map(c=>c.name);
  if(names.length===0){ active.value=''; return; }
  if(!names.includes(active.value)) active.value = names[0];
}, { immediate: true });

onMounted(()=>{ loadCategories(); loadSites(); });
</script>

