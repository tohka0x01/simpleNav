<template>
  <div class="fsel" :class="{ disabled }">
    <button class="fsel-btn" type="button" :disabled="disabled" @click="toggle" @keydown.down.prevent="openAndMove(0)" @keydown.enter.prevent="toggle()">
      <span class="label">{{ selectedLabel || placeholder }}</span>
      <span class="chev">▾</span>
    </button>
    <div v-show="open" class="panel" role="listbox" ref="panelRef">
      <button v-for="(opt,i) in flatOptions" :key="opt.value" class="option" :class="{ sel: i===hover, active: opt.value===modelValue }" role="option"
              @mouseenter="hover=i" @mouseleave="hover=-1" @click="select(opt.value)">
        <span class="dot" />
        <span class="opt-label">{{ opt.label }}</span>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from 'vue';

type Opt = string | { value: string; label?: string };
const props = defineProps<{ modelValue: string; options: Opt[]; placeholder?: string; disabled?: boolean }>();
const emit = defineEmits<{ (e:'update:modelValue', v:string): void }>();

const open = ref(false);
const hover = ref(-1);
const panelRef = ref<HTMLDivElement|null>(null);

const flatOptions = computed(()=> (props.options||[]).map(o => {
  if(typeof o === 'string') return { value: o, label: o };
  return { value: o.value, label: o.label || o.value };
}));
const selectedLabel = computed(()=> flatOptions.value.find(o=>o.value===props.modelValue)?.label || '');

function select(v:string){ emit('update:modelValue', v); close(); }
function toggle(){ open.value ? close() : openAndMove(Math.max(0, flatOptions.value.findIndex(o=>o.value===props.modelValue))); }
function openAndMove(i:number){ if(props.disabled) return; open.value = true; hover.value = i; }
function close(){ open.value = false; hover.value = -1; }
function move(delta:number){ if(!open.value){ openAndMove(Math.max(0, hover.value)); return; } const n=(hover.value+delta+flatOptions.value.length)%flatOptions.value.length; hover.value=n; }

function onDocClick(e:MouseEvent){
  const t = e.target as Node;
  if(panelRef.value && !panelRef.value.contains(t)){
    if(!(t as HTMLElement).closest('.fsel')) close();
  }
}
onMounted(()=> document.addEventListener('click', onDocClick));
onUnmounted(()=> document.removeEventListener('click', onDocClick));

watch(()=>props.disabled, (d)=>{ if(d) close(); });
</script>

<style scoped>
.fsel{position:relative;display:inline-block}
.fsel.disabled{opacity:.6;pointer-events:none}
.fsel-btn{display:flex;align-items:center;gap:10px;padding:10px 12px;border:1px solid var(--border);border-radius:999px;background:var(--surface);cursor:pointer;min-width:160px;box-shadow:0 12px 28px rgba(0,0,0,.25);color:var(--text)}
.fsel-btn:hover{box-shadow:0 18px 36px rgba(0,0,0,.28)}
.label{font-weight:500}
.chev{margin-left:auto;color:#9aa4b2}
.panel{position:absolute;top:100%;left:0;min-width:200px;margin-top:8px;padding:8px;background:rgba(18,23,32,.9);backdrop-filter:blur(10px);border:1px solid var(--border);border-radius:14px;box-shadow:0 28px 60px rgba(0,0,0,.35);z-index:1000;color:var(--text)}
.option{display:flex;align-items:center;gap:8px;padding:10px 12px;border-radius:10px;cursor:pointer;width:100%;text-align:left;border:none;background:transparent;color:var(--text)}
.option.sel{background:rgba(106,166,255,.12)}
.option.active .dot{background:var(--accent)}
.dot{width:8px;height:8px;border-radius:50%;background:#94a3b8}
.opt-label{font-weight:500}
</style>

