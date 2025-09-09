<template>
  <div class="category-nav">
    <div class="category-tabs">
      <button v-for="c in categories" :key="c" class="category-tab" :class="{active: c===active}" @click="$emit('select', c)">{{ c }}</button>
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{ categories: string[]; active: string }>();
defineEmits<{ (e:'select', value:string): void }>();
</script>

<style scoped>
.category-nav{margin-bottom:30px}
.category-tabs{display:flex;gap:10px;margin-bottom:20px;flex-wrap:wrap;justify-content:center}
.category-tab{padding:10px 20px;background:var(--surface);border:1px solid var(--border);border-radius:25px;cursor:pointer;transition:all .2s;font-size:.9rem;display:flex;align-items:center;gap:8px;color:var(--text)}
.category-tab.active{background:rgba(106,166,255,.15);color:var(--text);border-color:rgba(106,166,255,.35)}
.category-tab:hover:not(.active){background:rgba(255,255,255,.04)}
</style>


