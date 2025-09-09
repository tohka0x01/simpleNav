import { createApp } from 'vue';
import { createRouter, createWebHistory } from 'vue-router';
import App from './App.vue';
import Home from './pages/Home.vue';
import Admin from './pages/Admin.vue';
import './styles.css';
import Particles from '@tsparticles/vue3';
import { loadStarsPreset } from '@tsparticles/preset-stars';

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', component: Home },
    { path: '/admin', component: Admin }
  ]
});

const app = createApp(App);
app.use(router);
app.use(Particles, {
  init: async (engine) => {
    await loadStarsPreset(engine);
  }
});
app.mount('#app');


