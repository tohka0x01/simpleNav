<template>
  <div class="dark-theme">
    <vue-particles id="tsparticles" :options="particleOptions" />
    <div class="container">
      <header class="header">
        <h1>{{ title }}</h1>
        <p class="subtitle">{{ subtitle }}</p>
        <button class="settings-btn" @click="openKeyModal" title="设置">⚙️</button>
      </header>
      <router-view />
      <footer class="footer">
        <p>© 2025 <a href="https://github.com/tohka0x01/simpleNav" target="_blank" rel="noopener noreferrer">
          <span class="github-icon">💻</span> tohka0x01
        </a></p>
      </footer>
    </div>

    <!-- 管理密钥输入弹框 -->
    <div v-if="showKeyModal" class="key-gate" tabindex="-1" @click.self="closeKeyModal">
      <div class="key-card" role="dialog" aria-modal="true">
        <h2 class="key-title">管理员密钥</h2>
        <p class="key-sub">请输入密钥以进入管理后台</p>
        <div class="key-field">
          <input :type="showKey ? 'text' : 'password'"
                 v-model.trim="pendingKey"
                 placeholder="输入密钥..."
                 @keydown.enter="verifyKey"
                 ref="keyInput"
                 autofocus />
          <button class="icon-btn small" type="button" @click="showKey = !showKey" :aria-label="showKey ? '隐藏密钥' : '显示密钥'">{{ showKey ? '🙈' : '👁️' }}</button>
        </div>
        <div class="key-actions">
          <button class="btn primary" :disabled="verifying || !pendingKey" @click="verifyKey">{{ verifying ? '验证中…' : '进入' }}</button>
          <button class="btn" type="button" @click="closeKeyModal">取消</button>
          <span class="msg" :class="{ ok: verifyOk, err: verifyErr }">{{ verifyErr || verifyOk }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, nextTick } from 'vue';
import { useRouter } from 'vue-router';

const title = 'HOMEPAGE';
const subtitle = 'Your personal gateway to the web';

const router = useRouter();

// 密钥弹框相关状态
const showKeyModal = ref(false);
const pendingKey = ref('');
const verifying = ref(false);
const verifyErr = ref('');
const verifyOk = ref('');
const showKey = ref(false);
const keyInput = ref<HTMLInputElement>();

async function verifyKey(){
  verifyErr.value = '';
  verifyOk.value = '';
  if(!pendingKey.value) return;
  verifying.value = true;
  try{
    const res = await fetch('/api/auth/verify', { headers: { 'Authorization': `Bearer ${pendingKey.value}` }, cache:'no-store' });
    if(res.ok){
      localStorage.setItem('admin_key', pendingKey.value);
      verifyOk.value = '验证成功';
      await nextTick();
      setTimeout(() => {
        closeKeyModal();
        router.push('/admin');
      }, 500);
    }else{
      verifyErr.value = '密钥错误或未授权';
    }
  }catch{
    verifyErr.value = '网络错误，请稍后重试';
  }finally{
    verifying.value = false;
  }
}

function closeKeyModal(){
  showKeyModal.value = false;
  pendingKey.value = '';
  verifyErr.value = '';
  verifyOk.value = '';
  showKey.value = false;
}

// 当弹框显示时自动聚焦到输入框
async function openKeyModal(){
  showKeyModal.value = true;
  await nextTick();
  keyInput.value?.focus();
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
.footer a{color:var(--muted);text-decoration:none;display:inline-flex;align-items:center;gap:6px;transition:color 0.2s ease}
.footer a:hover{color:var(--accent);text-decoration:none}
.github-icon{font-size:1.1em;transition:transform 0.2s ease}
.footer a:hover .github-icon{transform:scale(1.1)}
.theme-toggle{display:none}

.header{position:relative}
.settings-btn{position:absolute;right:0;top:0;border:1px solid var(--border);background:transparent;color:var(--text);border-radius:12px;padding:8px 10px;cursor:pointer}
.settings-btn:hover{background:rgba(255,255,255,.06)}

/* 管理密钥弹框样式 */
.key-gate{
  position:fixed;
  inset:0;
  z-index:2000;
  display:grid;
  place-items:center;
  background:radial-gradient(60% 60% at 50% 40%, rgba(106,166,255,.15), transparent 60%), 
              linear-gradient(180deg, rgba(0,0,0,.65), rgba(0,0,0,.65));
  backdrop-filter: blur(4px);
}

.key-card{
  width:min(520px,92vw);
  border:1px solid var(--border);
  border-radius:18px;
  background:linear-gradient(180deg, #141a26, #0e141c);
  box-shadow:0 30px 80px rgba(0,0,0,.5);
  padding:22px;
  backdrop-filter:blur(10px);
  animation: modalSlideIn 0.3s ease-out;
}

@keyframes modalSlideIn {
  from {
    opacity: 0;
    transform: scale(0.9) translateY(-20px);
  }
  to {
    opacity: 1;
    transform: scale(1) translateY(0);
  }
}

.key-title{
  margin:0 0 6px;
  font-size:1.5rem;
  text-align:center;
  color: var(--text);
  font-weight: 600;
}

.key-sub{
  margin:0 0 14px;
  color:var(--muted);
  text-align:center;
  font-size: 0.95rem;
}

.key-field{
  display:flex;
  align-items:center;
  justify-content:center;
  gap:10px;
  margin-top:6px;
}

.key-field input{
  flex:0 1 360px;
  max-width:360px;
  width:100%;
  padding:12px 14px;
  border:1px solid var(--border);
  border-radius:14px;
  background:rgba(255,255,255,.04);
  color:var(--text);
  outline:none;
  transition:border-color .2s ease, box-shadow .2s ease;
  font-size: 1rem;
}

.key-field input:focus{
  border-color:var(--accent-weak);
  box-shadow:0 0 0 3px rgba(99,102,241,.25);
}

.key-field input::placeholder{
  color: #808892;
}

.icon-btn.small{
  padding:10px;
  border-radius:12px;
  border:1px solid var(--border);
  background:transparent;
  color:var(--text);
  cursor:pointer;
  transition: background-color 0.2s ease;
}

.icon-btn.small:hover{
  background:rgba(255,255,255,.06);
}

.key-actions{
  display:flex;
  align-items:center;
  justify-content:center;
  gap:10px;
  margin-top:14px;
  flex-wrap: wrap;
}

.key-actions .btn{
  padding:10px 16px;
  border:1px solid var(--border);
  border-radius:12px;
  background:linear-gradient(180deg,#1a1f2a,#141824);
  color:var(--text);
  cursor:pointer;
  box-shadow:0 8px 20px rgba(0,0,0,.25);
  transition: all 0.2s ease;
  font-size: 0.95rem;
}

.key-actions .btn.primary{
  border-color:var(--accent-weak);
  background:var(--accent);
  color:#0b1220;
  font-weight: 600;
}

.key-actions .btn:disabled{
  opacity:.6;
  cursor:not-allowed;
}

.key-actions .btn:hover:not(:disabled){
  transform: translateY(-1px);
  box-shadow:0 12px 24px rgba(0,0,0,.3);
}

.msg{
  margin-left:6px;
  font-size:.92rem;
  font-weight: 500;
}

.msg.ok{
  color:#34d399;
}

.msg.err{
  color:#f87171;
}

/* dark theme */
.dark-theme{background:transparent;color:var(--text)}
.dark-theme .header h1{color:var(--text)}
.dark-theme .footer{color:var(--muted)}

/* background remains pure black via --bg */
</style>
