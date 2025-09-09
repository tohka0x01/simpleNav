<template>
  <a :href="site.url" class="card" target="_blank" rel="noopener" @click.prevent="handleOpen">
    <div class="glow"></div>
    <canvas ref="cvs"></canvas>
    <div class="card-title">{{ site.title }}</div>
    <div class="card-description">{{ site.description }}</div>
  </a>
  
</template>

<script setup lang="ts">
import { onMounted, onUnmounted, ref, watch } from 'vue';

type Site = { id:string; title:string; url:string; description?:string; clicks?:number };
const props = defineProps<{ site: Site }>();
const emit = defineEmits<{ (e:'open', site:Site): void }>();
const cvs = ref<HTMLCanvasElement|null>(null);
let hostEl: HTMLElement | null = null;
let onMove: ((e: MouseEvent) => void) | null = null;

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
  canvas.width = rect.width;
  canvas.height = rect.height;
  ctx = canvas.getContext('2d');
}

function draw(){
  if(!ctx || !cvs.value) return;
  const canvas = cvs.value;
  ctx.clearRect(0,0,canvas.width,canvas.height);
  const cols = Math.floor(canvas.width / (GRID_SIZE + SPACING));
  const rows = Math.floor(canvas.height / (GRID_SIZE + SPACING));
  const now = Date.now();
  particles = particles.filter(p => now - p.start < p.lifetime);
  for(let i=1;i<rows-1;i++){
    for(let j=1;j<cols-1;j++){
      const x = j * (GRID_SIZE + SPACING);
      const y = i * (GRID_SIZE + SPACING);
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
  canvas.style.opacity = '1';
  canvas.style.clipPath = 'circle(100% at 50% 50%)';
  start();
}
function onLeave(){
  const canvas = cvs.value!;
  canvas.style.opacity = '0';
  canvas.style.clipPath = 'circle(0 at 50% 70%)';
  stop();
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
  stop();
});

watch(()=>props.site, ()=>{ /* future per-site color */ });
</script>

<style scoped>
canvas{position:absolute;inset:0;opacity:0;clip-path:circle(0 at 50% 70%);transition:opacity .8s ease-in-out, clip-path .1s ease-in-out;transition-delay:0s,.4s}
.card{position:relative;overflow:hidden;background:linear-gradient(180deg, var(--surface) 0%, var(--surface-2) 100%);border:1px solid var(--border);border-radius:16px;padding:22px;display:block;color:inherit;text-decoration:none;transition:transform .2s ease, box-shadow .2s ease, border-color .2s ease}
.glow{position:absolute;inset:-1px;border-radius:16px;pointer-events:none;background:radial-gradient(120px 80px at var(--mx,50%) var(--my,50%), rgba(106,166,255,.18), transparent 40%);opacity:0;transition:opacity .3s ease}
.card:hover .glow{opacity:1}
.card:hover{transform:translateY(-2px);box-shadow:0 24px 48px rgba(0,0,0,.35);border-color:rgba(106,166,255,.35)}
.card-title{position:relative;z-index:1;color:var(--text);font-weight:700;margin-bottom:8px}
.card-description{position:relative;z-index:1;color:var(--muted);opacity:.85}
</style>


