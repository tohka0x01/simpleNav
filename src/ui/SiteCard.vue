<template>
  <div class="card-wrap" ref="wrap">
    <a :href="site.url" class="card" target="_blank" rel="noopener" @click.prevent="handleOpen">
      <div class="glow"></div>
      <canvas ref="cvs"></canvas>
      <div class="card-title">
        <img v-if="faviconSrc" class="favicon" :src="faviconSrc" :alt="site.title + ' favicon'" width="18" height="18" loading="lazy" @error="onFaviconError" />
        <span class="title-text">{{ site.title }}</span>
      </div>
      <div class="card-description">{{ site.description }}</div>
    </a>
    <div class="card-popover" :class="{ 'is-visible': showPopover }">
      {{ site.description }}
    </div>
  </div>
  
</template>

<script setup lang="ts">
import { onMounted, onUnmounted, ref, watch } from 'vue';

type Site = { id:string; title:string; url:string; description?:string; clicks?:number; icon?: string };
const props = defineProps<{ site: Site }>();
const emit = defineEmits<{ (e:'open', site:Site): void }>();
const cvs = ref<HTMLCanvasElement|null>(null);
const wrap = ref<HTMLElement|null>(null);
const showPopover = ref(false);
let popTimer: number | null = null;
let hostEl: HTMLElement | null = null;
let onMove: ((e: MouseEvent) => void) | null = null;

// favicon handling
const faviconSrc = ref<string>('');
const DEFAULT_ICON = '/icons/globe.svg';
let triedFallback = false;

function getHost(u:string){
  try{ return new URL(u).hostname; }catch{ return ''; }
}
function initFavicon(){
  triedFallback = false;
  if(props.site.icon){ faviconSrc.value = props.site.icon; return; }
  const host = getHost(props.site.url);
  faviconSrc.value = host ? `https://icons.duckduckgo.com/ip3/${host}.ico` : DEFAULT_ICON;
}
function onFaviconError(){
  const host = getHost(props.site.url);
  if(!host){ faviconSrc.value = DEFAULT_ICON; return; }
  if(!triedFallback){
    triedFallback = true;
    faviconSrc.value = `https://www.google.com/s2/favicons?sz=64&domain=${host}`;
  }else{
    faviconSrc.value = DEFAULT_ICON;
  }
}

let ctx: CanvasRenderingContext2D | null = null;
let raf = 0;
let particles: Array<{x:number;y:number;start:number;lifetime:number}> = [];
const GRID_SIZE = 1;
const SPACING = 3;
const LIFETIME = 20000;
let color = '#60a5fa';

function setupCanvas(){
  const canvas = cvs.value!;
  const parent = canvas.parentElement as HTMLElement;
  const rect = parent.getBoundingClientRect();
  const { width, height } = rect;
  canvas.width = Math.ceil(width);
  canvas.height = Math.ceil(height);
  canvas.style.width = `${width}px`;
  canvas.style.height = `${height}px`;
  ctx = canvas.getContext('2d');
}

function draw(){
  if(!ctx || !cvs.value) return;
  const canvas = cvs.value;
  ctx.clearRect(0,0,canvas.width,canvas.height);
  const cell = GRID_SIZE + SPACING;
  const cols = Math.max(0, Math.floor((canvas.width - GRID_SIZE) / cell));
  const rows = Math.max(0, Math.floor((canvas.height - GRID_SIZE) / cell));
  const offsetX = Math.max(0, Math.round((canvas.width - (cols * cell + GRID_SIZE)) / 2));
  const offsetY = Math.max(0, Math.round((canvas.height - (rows * cell + GRID_SIZE)) / 2));
  const now = Date.now();
  particles = particles.filter(p => now - p.start < p.lifetime);
  for(let i=0;i<=rows;i++){
    for(let j=0;j<=cols;j++){
      const x = offsetX + j * cell;
      const y = offsetY + i * cell;
      if(x > canvas.width - GRID_SIZE || y > canvas.height - GRID_SIZE) continue;
      const exists = particles.find(p=>p.x===x && p.y===y);
      if(!exists){
        particles.push({ x, y, start: now, lifetime: Math.random()*LIFETIME });
      }
    }
  }
  ctx.fillStyle = color;
  particles.forEach(p=>{
    const alpha = (p.lifetime - (now - p.start)) / LIFETIME;
    ctx.globalAlpha = Math.max(0, Math.min(1, alpha));
    ctx.fillRect(p.x, p.y, GRID_SIZE, GRID_SIZE);
  });
  ctx.globalAlpha = 1;
  raf = requestAnimationFrame(draw);
}

function start(){
  stop();
  setupCanvas();
  raf = requestAnimationFrame(draw);
}
function stop(){
  if(raf) cancelAnimationFrame(raf);
  raf = 0; particles = [];
}

function handleOpen(){ emit('open', props.site); }

function onEnter(){
  const canvas = cvs.value!;
  const parent = canvas.parentElement as HTMLElement | null;
  const rect = (parent || canvas).getBoundingClientRect();
  const radius = Math.hypot(rect.width, rect.height);
  canvas.style.opacity = '1';
  canvas.style.clipPath = `circle(${radius}px at 50% 50%)`;
  start();
}
function onLeave(){
  const canvas = cvs.value!;
  canvas.style.opacity = '0';
  canvas.style.clipPath = 'circle(0px at 50% 70%)';
  stop();
}

function schedulePopoverShow(){
  if(popTimer){ clearTimeout(popTimer); }
  popTimer = window.setTimeout(()=>{ showPopover.value = true; }, 300);
}
function hidePopover(){
  if(popTimer){ clearTimeout(popTimer); popTimer = null; }
  showPopover.value = false;
}

onMounted(()=>{
  const canvas = cvs.value;
  const el = canvas?.parentElement as HTMLElement | null;
  hostEl = el || null;
  if(hostEl){
    hostEl.addEventListener('mouseenter', onEnter);
    hostEl.addEventListener('mouseleave', onLeave);
    onMove = (e:MouseEvent)=>{
      const rect = hostEl!.getBoundingClientRect();
      const mx = ((e.clientX - rect.left) / rect.width) * 100;
      const my = ((e.clientY - rect.top) / rect.height) * 100;
      hostEl!.style.setProperty('--mx', mx+'%');
      hostEl!.style.setProperty('--my', my+'%');
    };
    hostEl.addEventListener('mousemove', onMove);
  }
  const wrapEl = wrap.value;
  if(wrapEl){
    wrapEl.addEventListener('mouseenter', schedulePopoverShow);
    wrapEl.addEventListener('mouseleave', hidePopover);
  }
  // ensure initial size
  setupCanvas();
});
onUnmounted(()=>{
  if(hostEl){
    hostEl.removeEventListener('mouseenter', onEnter);
    hostEl.removeEventListener('mouseleave', onLeave);
    if(onMove){ hostEl.removeEventListener('mousemove', onMove); }
    hostEl = null;
    onMove = null;
  }
  if(wrap.value){
    wrap.value.removeEventListener('mouseenter', schedulePopoverShow);
    wrap.value.removeEventListener('mouseleave', hidePopover);
  }
  if(popTimer){ clearTimeout(popTimer); popTimer = null; }
  stop();
});

watch(()=>props.site, ()=>{ initFavicon(); /* future per-site color */ }, { immediate: true });
</script>

<style scoped>
/* wrapper to allow popover below card without clipping */
.card-wrap{position:relative}
.card-wrap:hover{z-index:20}

canvas{position:absolute;inset:0;opacity:0;clip-path:circle(0px at 50% 70%);transition:opacity .35s ease, clip-path .35s ease}
.card{position:relative;overflow:hidden;background:linear-gradient(180deg, var(--surface) 0%, var(--surface-2) 100%);border:1px solid var(--border);border-radius:16px;padding:22px;display:block;color:inherit;text-decoration:none;transition:transform .2s ease, box-shadow .2s ease, border-color .2s ease}
.glow{position:absolute;inset:-1px;border-radius:16px;pointer-events:none;background:radial-gradient(120px 80px at var(--mx,50%) var(--my,50%), rgba(106,166,255,.18), transparent 40%);opacity:0;transition:opacity .3s ease}
.card:hover .glow{opacity:1}
.card:hover{transform:translateY(-2px);box-shadow:0 24px 48px rgba(0,0,0,.35);border-color:rgba(106,166,255,.35)}
.card-title{position:relative;z-index:1;color:var(--text);font-weight:700;margin-bottom:8px;font-size:1.3rem;line-height:1.35;display:flex;align-items:baseline;gap:8px}
.title-text{display:block;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.favicon{width:16px;height:16px;border-radius:4px;background:var(--surface);box-shadow:0 0 0 1px var(--border) inset;flex:0 0 auto}
.card-description{
  position:relative;z-index:1;color:var(--muted);opacity:.85;
  /* multi-line clamp (webkit + modern) */
  display:-webkit-box; -webkit-box-orient:vertical; -webkit-line-clamp:2; line-clamp:2;
  overflow:hidden; text-overflow:ellipsis; white-space:normal;
  /* ensure wraps and avoid single-line fallback */
  word-break:break-word; overflow-wrap:anywhere;
  /* reserve exactly 2 lines of height for uniform cards */
  line-height:1.5; min-height:calc(1.5em * 2); max-height:calc(1.5em * 2);
}

/* delayed hover popover with full description */
.card-popover{position:absolute;top:calc(100% + 8px);left:0;right:0;background:var(--surface-2);border:1px solid var(--border);border-radius:12px;padding:12px;color:var(--text);box-shadow:0 16px 36px rgba(0,0,0,.45);opacity:0;transform:translateY(-4px);pointer-events:none;transition:opacity .15s ease, transform .15s ease}
.card-popover.is-visible{opacity:1;transform:translateY(0);pointer-events:auto}
</style>
