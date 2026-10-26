/* =========================================================
   D.PEDRO SOLUÇÕES — MENU RESPONSIVO AUTOMÁTICO
   Adapta o menu ao tamanho do ecrã em tempo real
   ========================================================= */
'use strict';

(function () {
  const BREAKPOINTS = { mobile: 768, tablet: 992, desktop: 1200 };

  function getDevice() {
    const w = window.innerWidth;
    if (w < BREAKPOINTS.mobile) return 'mobile';
    if (w < BREAKPOINTS.tablet) return 'tablet';
    if (w < BREAKPOINTS.desktop) return 'small-desktop';
    return 'desktop';
  }

  function apply() {
    const device = getDevice();
    const body = document.body;
    body.dataset.device = device;

    // Adiciona classe ao nav
    const nav = document.querySelector('nav');
    if (nav) {
      nav.dataset.device = device;
    }

    // Mega-menu: ajustar largura dinamicamente
    document.querySelectorAll('.mega-menu').forEach(m => {
      if (device === 'mobile') {
        m.style.minWidth = '100%';
        m.style.maxWidth = '100%';
      } else if (device === 'tablet') {
        m.style.minWidth = '580px';
        m.style.maxWidth = '700px';
      } else if (device === 'small-desktop') {
        m.style.minWidth = '700px';
        m.style.maxWidth = '900px';
      } else {
        m.style.minWidth = '900px';
        m.style.maxWidth = '1140px';
      }
    });

    // Botão hamburger em mobile
    let toggle = document.getElementById('navToggle');
    const menu = document.querySelector('.nav-menu');
    if (device === 'mobile') {
      if (!toggle && menu) {
        toggle = document.createElement('button');
        toggle.id = 'navToggle';
        toggle.innerHTML = '<i class="fas fa-bars"></i>';
        toggle.style.cssText = 'background:var(--primary);color:#fff;border:none;width:44px;height:44px;border-radius:12px;cursor:pointer;font-size:1.2rem;margin-left:auto;';
        toggle.onclick = () => {
          menu.style.display = menu.style.display === 'flex' ? 'none' : 'flex';
        };
        nav.appendChild(toggle);
      }
      if (menu) menu.style.display = 'none';
    } else {
      if (toggle) toggle.remove();
      if (menu) menu.style.display = '';
    }
  }

  // Reaplica em resize (debounced)
  let timer;
  window.addEventListener('resize', () => {
    clearTimeout(timer);
    timer = setTimeout(apply, 150);
  });

  document.addEventListener('DOMContentLoaded', apply);

  window.NAV_RESPONSIVE = { apply, getDevice };
})();