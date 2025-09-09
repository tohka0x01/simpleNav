<template>
  <div class="search-container">
    <div class="search-wrapper">
      <div class="selector">
        <button class="selector-btn" :aria-expanded="open" @click="toggle" @keydown.down.prevent="openAndMove(0)" @keydown.enter.prevent="toggle()">
          <span class="icon" v-html="iconSvg"></span>
          <span class="name">{{ engines[active].name }}</span>
          <span class="chev">▾</span>
        </button>
        <div v-show="open" class="panel" role="listbox" ref="panelRef">
          <button v-for="(e,i) in engines" :key="e.name" class="option" :class="{ sel: i===hover }" role="option"
                  @mouseenter="hover=i" @mouseleave="hover=-1" @click="select(i)">
            <span class="icon" v-html="svgFor(e.name)"></span>
            <span class="label">{{ e.name }}</span>
          </button>
        </div>
      </div>

      <div class="input-wrap" @keydown.down.prevent="move(1)" @keydown.up.prevent="move(-1)" @keydown.esc="close" @keydown.enter.prevent="submit">
        <span class="input-icon">🔍</span>
        <input class="input" :placeholder="engines[active].placeholder" v-model="q" />
        <button v-if="q" class="clear" @click="q=''" aria-label="Clear">✕</button>
        <button class="go" @click="submit">Search</button>
      </div>
    </div>
  </div>
  
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue';

const engines = [
  { name:'Google', url:'https://www.google.com/search?q=', placeholder:'Search with Google...' },
  { name:'Bing', url:'https://www.bing.com/search?q=', placeholder:'Search with Bing...' },
  { name:'DuckDuckGo', url:'https://duckduckgo.com/?q=', placeholder:'Search with DuckDuckGo...' },
  { name:'Baidu', url:'https://www.baidu.com/s?wd=', placeholder:'Search with Baidu...' }
];

const emit = defineEmits<{ (e:'submit', engine:{url:string}, q:string):void }>();
const active = ref<number>(0);
const open = ref<boolean>(false);
const hover = ref<number>(-1);
const q = ref<string>('');
const panelRef = ref<HTMLDivElement|null>(null);

function select(i:number){ active.value = i; close(); }
function toggle(){ open.value ? close() : openAndMove(active.value); }
function openAndMove(i:number){ open.value = true; hover.value = i; }
function close(){ open.value = false; hover.value = -1; }
function submit(){ emit('submit', engines[active.value], q.value.trim()); }
function move(delta:number){ if(!open.value){ openAndMove(active.value); return; } const n=(hover.value+delta+engines.length)%engines.length; hover.value=n; }

function onDocClick(e:MouseEvent){
  const t = e.target as Node;
  if(panelRef.value && !panelRef.value.contains(t)){
    // best-effort: close when clicking outside panel; selector button toggles itself
    if(!(t as HTMLElement).closest('.selector')) close();
  }
}
onMounted(()=> document.addEventListener('click', onDocClick));
onUnmounted(()=> document.removeEventListener('click', onDocClick));

function hexToRgba(hex:string, alpha:number){
  const h = hex.replace('#','');
  const bigint = parseInt(h.length===3 ? h.split('').map(c=>c+c).join('') : h, 16);
  const r = (bigint >> 16) & 255;
  const g = (bigint >> 8) & 255;
  const b = bigint & 255;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}
function meta(name:string){
  const key = (name||'').toLowerCase();
  if(key.includes('google')) return { color:'#4285F4', label:'G' };
  if(key.includes('bing')) return { color:'#008373', label:'B' };
  if(key.includes('duck')) return { color:'#DE5833', label:'D' };
  if(key.includes('baidu')) return { color:'#3385ff', label:'B' };
  return { color:'#3b82f6', label:name.charAt(0).toUpperCase() };
}
function svgFor(name:string){
  const m = meta(name);
  const bg = hexToRgba(m.color, 0.10);
  return `<svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><circle cx="12" cy="12" r="10" fill="${bg}" stroke="${m.color}" stroke-width="1.5" /><text x="12" y="16" text-anchor="middle" font-size="12" font-weight="600" fill="${m.color}" font-family="-apple-system,BlinkMacSystemFont,Segoe UI,Roboto,Helvetica,Arial,sans-serif">${m.label}</text></svg>`;
}
const iconSvg = computed(()=> svgFor(engines[active.value].name));
</script>

<style scoped>
.search-container{margin-bottom:40px}
.search-wrapper{position:relative;max-width:800px;margin:0 auto;display:flex;gap:12px;align-items:center}

/* Modern selector */
.selector{position:relative;flex-shrink:0}
.selector-btn{display:flex;align-items:center;gap:10px;padding:12px 14px;border:1px solid var(--border);border-radius:999px;background:var(--surface);cursor:pointer;min-width:180px;box-shadow:0 12px 28px rgba(0,0,0,.25)}
.selector-btn:hover{box-shadow:0 20px 40px rgba(0,0,0,.28)}
.selector .icon{display:inline-flex}
.selector .name{font-weight:500;color:var(--text)}
.selector .chev{margin-left:auto;color:#6b7280}
.panel{position:absolute;top:100%;left:0;right:auto;min-width:220px;margin-top:8px;padding:8px;background:rgba(18,23,32,.85);backdrop-filter:blur(10px);border:1px solid var(--border);border-radius:14px;box-shadow:0 28px 60px rgba(0,0,0,.35);z-index:1000;color:var(--text)}
.option{display:flex;align-items:center;gap:10px;padding:10px 12px;border-radius:10px;cursor:pointer;width:100%;text-align:left;border:none;background:transparent;color:var(--text)}
.option.sel{background:rgba(106,166,255,.12)}
.option .label{font-weight:500;color:var(--text)}

/* Modern input */
.input-wrap{position:relative;display:flex;align-items:center;flex:1;border:1px solid var(--border);border-radius:999px;padding:6px 6px 6px 42px;background:var(--surface-2);box-shadow:0 12px 28px rgba(0,0,0,.25)}
.input-icon{position:absolute;left:14px;color:var(--muted)}
.input{flex:1;border:none;background:transparent;outline:none;font-size:1rem;padding:10px;color:var(--text)}
.clear{border:none;background:transparent;cursor:pointer;color:var(--muted);padding:6px;border-radius:8px;margin-right:4px}
.clear:hover{background:rgba(255,255,255,.06);color:#cbd5e1}
.go{border:1px solid var(--accent-weak);background:var(--accent);color:#0b1220;border-radius:999px;padding:8px 14px;cursor:pointer}
.go:hover{filter:brightness(1.05)}

/* Dark theme tweaks (inherit from page) */
:global(.dark-theme) .selector-btn{background:#18181b;border-color:#27272a;color:#fafafa}
:global(.dark-theme) .panel{background:rgba(24,24,27,.9);border-color:#27272a}
:global(.dark-theme) .option.sel{background:#1e3a8a}
:global(.dark-theme) .input-wrap{background:linear-gradient(180deg,#18181b 0%, #0f0f12 100%);border-color:#27272a}
:global(.dark-theme) .input{color:#fafafa}
:global(.dark-theme) .clear:hover{background:#27272a}
</style>


