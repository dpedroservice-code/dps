/* =========================================================
   D.PEDRO SOLUÇÕES — CARRINHO
   ========================================================= */
'use strict';

(function () {
  const STORAGE_CART = 'dpedro_cart';
  const STORAGE_ORDERS = 'dpedro_orders';
  const WA_NUMBER = '244946299834';
  const EMAIL = 'dpedroservice@gmail.com';

  function fmtKz(n) {
    return 'Kz ' + Number(n).toLocaleString('pt-AO');
  }
  function escapeHtml(s) {
    const d = document.createElement('div');
    d.textContent = s || '';
    return d.innerHTML;
  }
  function loadCart() {
    try { return JSON.parse(localStorage.getItem(STORAGE_CART) || '[]'); }
    catch (e) { return []; }
  }
  function saveCart(items) {
    localStorage.setItem(STORAGE_CART, JSON.stringify(items));
    updateBadge();
  }
  function updateBadge() {
    const total = loadCart().reduce((s, i) => s + i.qty, 0);
    document.querySelectorAll('.cart-count').forEach(el => el.textContent = total);
  }

  function addToCart(product, qty) {
    qty = Math.max(1, parseInt(qty) || 1);
    const items = loadCart();
    const idx = items.findIndex(i => i.id === product.id);
    const price = product.promo || product.price;
    if (idx > -1) {
      items[idx].qty = Math.min(product.stock, items[idx].qty + qty);
    } else {
      items.push({
        id: product.id,
        name: product.name,
        price,
        image: product.image,
        qty: Math.min(product.stock, qty)
      });
    }
    saveCart(items);
    renderCart();
    showToast(`${product.name} adicionado`);
    openCart();
  }

  function removeFromCart(id) {
    saveCart(loadCart().filter(i => i.id !== id));
    renderCart();
  }

  function changeQty(id, delta) {
    const items = loadCart();
    const it = items.find(i => i.id === id);
    if (!it) return;
    it.qty = Math.max(1, it.qty + delta);
    saveCart(items);
    renderCart();
  }

  function renderCart() {
    const items = loadCart();
    const box = document.getElementById('cartItems');
    const totalEl = document.getElementById('cartTotal');
    if (!box) return;
    if (!items.length) {
      box.innerHTML = '<div class="cart-empty"><i class="fas fa-shopping-cart"></i>O seu carrinho está vazio.</div>';
    } else {
      box.innerHTML = items.map(i => `
        <div class="cart-item">
          <img src="${i.image}" alt="${escapeHtml(i.name)}" onerror="this.src='https://placehold.co/60x60/2563eb/white?text=P'">
          <div class="cart-item-info">
            <h4>${escapeHtml(i.name)}</h4>
            <div class="price">${fmtKz(i.price)}</div>
            <div class="cart-item-qty">
              <button onclick="DPEDRO_CART.changeQty(${i.id},-1)">−</button>
              <span>${i.qty}</span>
              <button onclick="DPEDRO_CART.changeQty(${i.id},1)">+</button>
            </div>
          </div>
          <button class="cart-item-remove" onclick="DPEDRO_CART.remove(${i.id})"><i class="fas fa-trash"></i></button>
        </div>
      `).join('');
    }
    const total = items.reduce((s, i) => s + i.price * i.qty, 0);
    if (totalEl) totalEl.textContent = fmtKz(total);
  }

  function openCart() {
    document.getElementById('cartDrawer')?.classList.add('open');
    document.getElementById('cartBackdrop')?.classList.add('active');
    renderCart();
  }
  function closeCart() {
    document.getElementById('cartDrawer')?.classList.remove('open');
    document.getElementById('cartBackdrop')?.classList.remove('active');
  }

  function saveOrder(method, items, total) {
    try {
      const orders = JSON.parse(localStorage.getItem(STORAGE_ORDERS) || '[]');
      orders.push({
        id: Date.now(),
        date: new Date().toISOString(),
        total,
        method,
        items
      });
      localStorage.setItem(STORAGE_ORDERS, JSON.stringify(orders));
    } catch (e) {}
  }

  function checkoutWhatsApp() {
    const items = loadCart();
    if (!items.length) { alert('Carrinho vazio'); return; }
    const total = items.reduce((s, i) => s + i.price * i.qty, 0);
    let msg = '*PEDIDO — D.PEDRO SOLUÇÕES*\n\n';
    items.forEach(i => { msg += `• ${i.name} (x${i.qty}) — ${fmtKz(i.price * i.qty)}\n`; });
    msg += `\n*TOTAL:* ${fmtKz(total)}`;
    saveOrder('WhatsApp', items, total);
    if (typeof gtag === 'function') gtag('event', 'purchase', { value: total, currency: 'AOA' });
    window.open(`https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(msg)}`, '_blank');
    localStorage.removeItem(STORAGE_CART);
    renderCart(); updateBadge(); closeCart();
  }

  function checkoutEmail() {
    const items = loadCart();
    if (!items.length) { alert('Carrinho vazio'); return; }
    const total = items.reduce((s, i) => s + i.price * i.qty, 0);
    let body = 'PEDIDO — D.PEDRO SOLUÇÕES\n\n';
    items.forEach(i => { body += `${i.name} (x${i.qty}) — ${fmtKz(i.price * i.qty)}\n`; });
    body += `\nTOTAL: ${fmtKz(total)}`;
    saveOrder('Email', items, total);
    window.location.href = `mailto:${EMAIL}?subject=Pedido%20D.PEDRO&body=${encodeURIComponent(body)}`;
    localStorage.removeItem(STORAGE_CART);
    renderCart(); updateBadge(); closeCart();
  }

  function showToast(msg) {
    const t = document.getElementById('toast');
    if (!t) return;
    t.textContent = msg;
    t.classList.add('show');
    clearTimeout(t._timer);
    t._timer = setTimeout(() => t.classList.remove('show'), 2500);
  }

  // Expõe globalmente
  window.DPEDRO_CART = {
    load: loadCart,
    save: saveCart,
    add: addToCart,
    remove: removeFromCart,
    changeQty,
    render: renderCart,
    open: openCart,
    close: closeCart,
    checkoutWhatsApp,
    checkoutEmail,
    updateBadge
  };

  // Aliases globais usados pelo HTML
  window.addToCart = addToCart;
  window.removeFromCart = removeFromCart;
  window.changeCartQty = changeQty;
  window.openCart = openCart;
  window.closeCart = closeCart;
  window.checkoutWhatsApp = checkoutWhatsApp;
  window.checkoutEmail = checkoutEmail;
  window.fmtKz = fmtKz;

  document.addEventListener('DOMContentLoaded', () => {
    renderCart();
    updateBadge();
  });
})();