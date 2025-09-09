<template>
  <div class="section">
    <h2 class="section-title">{{ title || 'My Sites' }}</h2>
    <div class="cards-grid">
      <SiteCard v-for="s in sites" :key="s.id" :site="s" @open="$emit('open', s)" />
    </div>
  </div>
</template>

<script setup lang="ts">
import SiteCard from './SiteCard.vue';
defineProps<{ sites: Array<{ id:string; title:string; url:string; description?:string; clicks?:number }>; title?: string }>();
defineEmits<{ (e:'open', site:any): void }>();
</script>

<style scoped>
.section{margin-bottom:40px}
.section-title{font-size:1.5rem;color:var(--text);font-weight:600;border-left:3px solid var(--border);padding-left:15px;margin-bottom:20px}
.cards-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:20px}
/* Card visuals are defined in SiteCard.vue to match dark theme */
</style>


