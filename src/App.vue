<template>
  <div class="dark-theme">
    <vue-particles id="tsparticles" :options="particleOptions" />
    <div class="container">
      <header class="header">
        <h1>{{ title }}</h1>
        <p class="subtitle">{{ subtitle }}</p>
        <button class="settings-btn" @click="openAdmin" title="设置">⚙️</button>
      </header>
      <router-view />
      <footer class="footer">
        <p>© 2025 <a href="#" @click.prevent>My Navigation Homepage</a></p>
      </footer>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router';
const title = 'My Navigation Homepage';
const subtitle = 'Your personal gateway to the web';

const router = useRouter();

async function openAdmin(){
  const input = window.prompt('请输入管理密钥');
  if(!input) return;
  try{
    const res = await fetch('/api/auth/verify', { headers: { 'Authorization': `Bearer ${input}` }, cache:'no-store' });
    if(res.ok){
      localStorage.setItem('admin_key', input);
      router.push('/admin');
    }else{
      alert('密钥错误或未配置');
    }
  }catch{
    alert('校验失败，请稍后重试');
  }
}

const particleOptions = {
  preset: 'stars',
  fullScreen: { enable: true, zIndex: 0 },
  background: { color: { value: '#000000' } }
};
</script>

<style scoped>
/* core layout */
.container{max-width:1200px;margin:0 auto;padding:20px}
.header{text-align:center;margin-bottom:40px}
.header h1{font-size:2.5rem;color:var(--text);font-weight:600;margin-bottom:10px}
.subtitle{color:var(--muted);margin-top:10px}
.footer{text-align:center;margin-top:60px;padding:20px;color:var(--muted);font-size:.9rem}
.footer a{color:var(--muted);text-decoration:none}
.footer a:hover{text-decoration:none}
.theme-toggle{display:none}

.header{position:relative}
.settings-btn{position:absolute;right:0;top:0;border:1px solid var(--border);background:transparent;color:var(--text);border-radius:12px;padding:8px 10px;cursor:pointer}
.settings-btn:hover{background:rgba(255,255,255,.06)}

/* dark theme */
.dark-theme{background:transparent;color:var(--text)}
.dark-theme .header h1{color:var(--text)}
.dark-theme .footer{color:var(--muted)}

/* background remains pure black via --bg */
</style>
