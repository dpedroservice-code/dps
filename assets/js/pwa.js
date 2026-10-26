/* =========================================================
   D.PEDRO SOLUÇÕES — REGISTO PWA
   ========================================================= */
'use strict';

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js')
      .then(reg => console.log('✅ SW registado:', reg.scope))
      .catch(err => console.warn('⚠️ SW falhou:', err));
  });
}

// Instalação PWA
let deferredPrompt;
window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  deferredPrompt = e;
  const btn = document.getElementById('installPwa');
  if (btn) btn.style.display = 'inline-flex';
});

function installPwa() {
  if (!deferredPrompt) return;
  deferredPrompt.prompt();
  deferredPrompt.userChoice.then(choice => {
    if (choice.outcome === 'accepted') console.log('✅ PWA instalada');
    deferredPrompt = null;
  });
}