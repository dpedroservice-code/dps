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
  function safeImageUrl(value) {
    const src = String(value || '').trim();
    if (src.startsWith('https://') || src.startsWith('http://') || src.startsWith('/') || src.startsWith('./') || src.startsWith('../') || src.startsWith('assets/')) return src;
    return 'assets/1.png';
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
      items[idx].stock = Number(product.stock) || items[idx].stock || 0;
      items[idx].qty = Math.min(items[idx].stock, items[idx].qty + qty);
    } else {
      items.push({
        id: product.id,
        name: product.name,
        price,
        image: product.image,
        stock: Number(product.stock) || 0,
        qty: Math.min(Number(product.stock) || 0, qty)
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
    const maxStock = it.stock == null ? 999999 : Math.max(0, Number(it.stock));
    it.qty = Math.max(1, Math.min(maxStock || 1, it.qty + delta));
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
          <img src="${escapeHtml(safeImageUrl(i.image))}" alt="${escapeHtml(i.name)}" onerror="this.src='https://placehold.co/60x60/2563eb/white?text=P'">
          <div class="cart-item-info">
            <h4>${escapeHtml(i.name)}</h4>
            <div class="price">${fmtKz(i.price)}</div>
            <div class="cart-item-qty">
              <button onclick="DPEDRO_CART.changeQty(${JSON.stringify(String(i.id))},-1)">−</button>
              <span>${i.qty}</span>
              <button onclick="DPEDRO_CART.changeQty(${JSON.stringify(String(i.id))},1)">+</button>
            </div>
          </div>
          <button class="cart-item-remove" onclick="DPEDRO_CART.remove(${JSON.stringify(String(i.id))})"><i class="fas fa-trash"></i></button>
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

  function collectCustomer() {
    const value = id => String(document.getElementById(id)?.value || '').trim();
    const customer = {
      name: value('cartCustomerName'),
      phone: value('cartCustomerPhone'),
      email: value('cartCustomerEmail'),
      address: value('cartCustomerAddress')
    };
    if (!customer.name || !customer.phone) {
      alert('Informe o nome completo e o telefone/WhatsApp para registar o pedido.');
      return null;
    }
    if (customer.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customer.email)) {
      alert('O e-mail introduzido não é válido.');
      return null;
    }
    return customer;
  }

  function createClientRef() {
    const id = window.crypto?.randomUUID ? window.crypto.randomUUID() : Date.now().toString(36) + '-' + Math.random().toString(36).slice(2);
    return 'WEB-' + id;
  }

  function clearCustomerForm() {
    ['cartCustomerName','cartCustomerPhone','cartCustomerEmail','cartCustomerAddress'].forEach(id => {
      const field = document.getElementById(id);
      if (field) field.value = '';
    });
  }

  function saveOrder(method, items, total, customer, clientRef) {
    try {
      const orders = JSON.parse(localStorage.getItem(STORAGE_ORDERS) || '[]');
      orders.push({ id: Date.now(), date: new Date().toISOString(), total, method, customer, client_ref: clientRef, items });
      localStorage.setItem(STORAGE_ORDERS, JSON.stringify(orders));
    } catch (e) {}
  }

  async function checkoutWhatsApp() {
    const items = loadCart();
    if (!items.length) { alert('Carrinho vazio'); return; }
    const customer = collectCustomer();
    if (!customer) return;
    const clientRef = createClientRef();
    const popup = window.open('about:blank', '_blank');
    const total = items.reduce((s, i) => s + i.price * i.qty, 0);
    let order = null;
    let localRef = '';
    try {
      if (window.DPS_CLOUD_STORE) order = await window.DPS_CLOUD_STORE.createOrder('WhatsApp', items, customer, clientRef);
      else throw new Error('Serviço de sincronização indisponível.');
    } catch (error) {
      if (error.status && error.status >= 400 && error.status < 500) {
        if (popup) popup.close();
        alert(error.message || 'O pedido não foi registado porque o stock ou os produtos mudaram. Atualize o carrinho.');
        return;
      }
      localRef = window.DPS_CLOUD_STORE?.queueOrder('WhatsApp', items, customer, clientRef) || clientRef;
      saveOrder('WhatsApp - sincronização pendente', items, total, customer, clientRef);
    }
    const reference = order?.order_number || localRef;
    let msg = '*PEDIDO — D.PEDRO SOLUÇÕES*\n';
    if (reference) msg += '*Referência:* ' + reference + '\n';
    msg += '*Cliente:* ' + customer.name + '\n';
    msg += '*Telefone:* ' + customer.phone + '\n';
    if (customer.email) msg += '*E-mail:* ' + customer.email + '\n';
    if (customer.address) msg += '*Entrega:* ' + customer.address + '\n';
    msg += '\n';
    items.forEach(i => { msg += '• ' + i.name + ' (x' + i.qty + ') — ' + fmtKz(i.price * i.qty) + '\n'; });
    msg += '\n*TOTAL APRESENTADO:* ' + fmtKz(total);
    if (order?.total != null) msg += '\n*TOTAL VALIDADO NO SERVIDOR:* ' + fmtKz(order.total);
    msg += '\n\nAguardo confirmação de disponibilidade e pagamento.';
    if (typeof gtag === 'function') gtag('event', 'purchase', { value: total, currency: 'AOA' });
    const waUrl = 'https://wa.me/' + WA_NUMBER + '?text=' + encodeURIComponent(msg);
    if (popup && !popup.closed) popup.location.href = waUrl;
    else window.location.href = waUrl;
    localStorage.removeItem(STORAGE_CART);
    clearCustomerForm();
    renderCart(); updateBadge(); closeCart();
  }

  async function checkoutEmail() {
    const items = loadCart();
    if (!items.length) { alert('Carrinho vazio'); return; }
    const customer = collectCustomer();
    if (!customer) return;
    const clientRef = createClientRef();
    const total = items.reduce((s, i) => s + i.price * i.qty, 0);
    let order = null;
    let localRef = '';
    try {
      if (window.DPS_CLOUD_STORE) order = await window.DPS_CLOUD_STORE.createOrder('Email', items, customer, clientRef);
      else throw new Error('Serviço de sincronização indisponível.');
    } catch (error) {
      if (error.status && error.status >= 400 && error.status < 500) {
        alert(error.message || 'O pedido não foi registado porque o stock ou os produtos mudaram. Atualize o carrinho.');
        return;
      }
      localRef = window.DPS_CLOUD_STORE?.queueOrder('Email', items, customer, clientRef) || clientRef;
      saveOrder('Email - sincronização pendente', items, total, customer, clientRef);
    }
    let body = 'PEDIDO — D.PEDRO SOLUÇÕES\n';
    if (order?.order_number || localRef) body += 'Referência: ' + (order?.order_number || localRef) + '\n';
    body += 'Cliente: ' + customer.name + '\nTelefone: ' + customer.phone + '\n';
    if (customer.email) body += 'E-mail: ' + customer.email + '\n';
    if (customer.address) body += 'Entrega: ' + customer.address + '\n';
    body += '\n';
    items.forEach(i => { body += i.name + ' (x' + i.qty + ') — ' + fmtKz(i.price * i.qty) + '\n'; });
    body += '\nTOTAL APRESENTADO: ' + fmtKz(total);
    if (order?.total != null) body += '\nTOTAL VALIDADO NO SERVIDOR: ' + fmtKz(order.total);
    body += '\n\nAguardo confirmação de disponibilidade e pagamento.';
    window.location.href = 'mailto:' + EMAIL + '?subject=Pedido%20D.PEDRO&body=' + encodeURIComponent(body);
    localStorage.removeItem(STORAGE_CART);
    clearCustomerForm();
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