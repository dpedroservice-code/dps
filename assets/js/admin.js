/* =========================================================
   D.PEDRO SOLUÇÕES — ADMIN AVANÇADO
   CRUD + Estados + Partilha + ERP
   ========================================================= */
'use strict';

(function () {
  const ADMIN_PASSWORD = 'dpedro2026';
  const STORAGE_ORDERS = 'dpedro_orders';

  let products = [];
  let currentFilter = 'all';
  let currentSearch = '';

  function escapeHtml(s) {
    const d = document.createElement('div'); d.textContent = s || ''; return d.innerHTML;
  }
  function showToast(msg) {
    const t = document.getElementById('toast');
    if (!t) return;
    t.textContent = msg; t.classList.add('show');
    clearTimeout(t._timer);
    t._timer = setTimeout(() => t.classList.remove('show'), 2500);
  }

  // ---------- LOGIN ----------
  function doLogin() {
    const pass = document.getElementById('adminPassword')?.value;
    if (pass === ADMIN_PASSWORD) {
      localStorage.setItem('dpedro_admin', 'true');
      document.getElementById('loginScreen').style.display = 'none';
      document.getElementById('adminPanel').style.display = 'block';
      products = window.DPEDRO_DB.loadProducts();
      renderAdmin();
      showToast('✅ Login efetuado');
    } else {
      const e = document.getElementById('loginError');
      if (e) e.textContent = '❌ Senha incorreta';
    }
  }
  function logout() {
    localStorage.removeItem('dpedro_admin');
    location.reload();
  }

  // ---------- FILTROS ----------
  function setFilter(f) {
    currentFilter = f;
    document.querySelectorAll('[data-filter]').forEach(b => {
      b.classList.toggle('active', b.dataset.filter === f);
    });
    renderAdmin();
  }
  function setSearch(v) { currentSearch = v.toLowerCase(); renderAdmin(); }

  function filteredProducts() {
    return products.filter(p => {
      const matchStatus = currentFilter === 'all' || p.status === currentFilter;
      const matchSearch = !currentSearch || p.name.toLowerCase().includes(currentSearch) ||
                          (p.brand || '').toLowerCase().includes(currentSearch);
      return matchStatus && matchSearch;
    });
  }

  // ---------- RENDER ----------
  function renderAdmin() {
    products = window.DPEDRO_DB.loadProducts();
    // stats
    const counts = {
      total: products.length,
      publicado: products.filter(p => p.status === 'publicado').length,
      rascunho: products.filter(p => p.status === 'rascunho').length,
      partilhado: products.filter(p => p.status === 'partilhado').length,
      stockOut: products.filter(p => p.stock === 0).length
    };
    setText('statTotal', counts.total);
    setText('statPublicado', counts.publicado);
    setText('statRascunho', counts.rascunho);
    setText('statPartilhado', counts.partilhado);
    setText('statOut', counts.stockOut);

    const list = filteredProducts();
    const tbody = document.getElementById('adminTableBody');
    if (!tbody) return;

    if (!list.length) {
      tbody.innerHTML = `<tr><td colspan="7" style="text-align:center;padding:2rem;color:var(--text-muted);">Nenhum produto encontrado.</td></tr>`;
      return;
    }

    tbody.innerHTML = list.map(p => `
      <tr>
        <td><img src="${p.image}" onerror="this.src='https://placehold.co/44x44/2563eb/white?text=P'" style="width:44px;height:44px;object-fit:cover;border-radius:6px;"></td>
        <td>
          <strong>${escapeHtml(p.name)}</strong>
          <div style="font-size:.75rem;color:var(--text-muted)">${escapeHtml(p.brand || '—')}</div>
        </td>
        <td>${window.DPEDRO_DB.categories.find(c => c.id === p.category)?.name || p.category}</td>
        <td>${p.promo ? '<span style="color:var(--warning);font-weight:700">' + window.DPEDRO_DB.fmtKz(p.promo) + '</span>' : window.DPEDRO_DB.fmtKz(p.price)}</td>
        <td>${p.stock}</td>
        <td>${badgeStatus(p.status)}</td>
        <td style="white-space:nowrap;">
          <button class="btn-icon-sm" style="background:var(--warning);color:#fff;" onclick="ADMIN.openForm(${p.id})" title="Editar"><i class="fas fa-edit"></i></button>
          <button class="btn-icon-sm" style="background:${p.status === 'publicado' ? 'var(--success)' : 'var(--primary)'};color:#fff;" onclick="ADMIN.toggleStatus(${p.id})" title="Publicar/Despublicar"><i class="fas fa-${p.status === 'publicado' ? 'eye-slash' : 'eye'}"></i></button>
          <button class="btn-icon-sm" style="background:#0ea5e9;color:#fff;" onclick="ADMIN.shareProduct(${p.id})" title="Partilhar"><i class="fas fa-share-alt"></i></button>
          <button class="btn-icon-sm" style="background:var(--danger);color:#fff;" onclick="ADMIN.deleteProduct(${p.id})" title="Eliminar"><i class="fas fa-trash"></i></button>
        </td>
      </tr>
    `).join('');
  }

  function badgeStatus(s) {
    const map = {
      publicado: { bg:'var(--success)', txt:'Publicado' },
      rascunho:  { bg:'#64748b',        txt:'Rascunho' },
      partilhado:{ bg:'#0ea5e9',        txt:'Partilhado' }
    };
    const v = map[s] || map.rascunho;
    return `<span style="background:${v.bg};color:#fff;padding:.2rem .6rem;border-radius:20px;font-size:.72rem;font-weight:700;">${v.txt}</span>`;
  }

  function setText(id, v) { const el = document.getElementById(id); if (el) el.textContent = v; }

  // ---------- FORM ----------
  function openForm(id) {
    document.getElementById('formTitle').innerHTML = id ? '<i class="fas fa-edit"></i> Editar Produto' : '<i class="fas fa-plus"></i> Novo Produto';
    document.getElementById('formId').value = id || '';
    const sel = document.getElementById('formCategory');
    sel.innerHTML = window.DPEDRO_DB.categories.filter(c => c.id !== 'all')
      .map(c => `<option value="${c.id}">${c.name}</option>`).join('');

    const selStatus = document.getElementById('formStatus');
    if (selStatus) {
      selStatus.innerHTML = `
        <option value="publicado">Publicado</option>
        <option value="rascunho">Rascunho</option>
        <option value="partilhado">Partilhado</option>`;
    }

    if (id) {
      const p = products.find(x => x.id === id);
      if (p) {
        document.getElementById('formName').value = p.name || '';
        document.getElementById('formCategory').value = p.category || 'informatica';
        document.getElementById('formStatus').value = p.status || 'rascunho';
        document.getElementById('formBrand').value = p.brand || '';
        document.getElementById('formPrice').value = p.price || '';
        document.getElementById('formPromo').value = p.promo || '';
        document.getElementById('formStock').value = p.stock || 0;
        document.getElementById('formWarranty').value = p.warranty || '';
        document.getElementById('formImage').value = p.image || '';
        document.getElementById('formSpecs').value = p.specs || '';
        document.getElementById('formDescription').value = p.description || '';
      }
    } else {
      ['formName','formBrand','formPrice','formPromo','formStock','formWarranty','formImage','formSpecs','formDescription']
        .forEach(k => document.getElementById(k).value = '');
      document.getElementById('formCategory').value = 'informatica';
      if (selStatus) selStatus.value = 'rascunho';
    }
    document.getElementById('formModal').classList.add('active');
  }
  function closeForm() { document.getElementById('formModal').classList.remove('active'); }

  function saveForm() {
    const id = document.getElementById('formId').value;
    const name = document.getElementById('formName').value.trim();
    const price = parseInt(document.getElementById('formPrice').value);
    if (!name || !price) { alert('Preencha nome e preço'); return; }

    const data = {
      name,
      category: document.getElementById('formCategory').value,
      status: document.getElementById('formStatus')?.value || 'rascunho',
      brand: document.getElementById('formBrand').value.trim(),
      price,
      promo: parseInt(document.getElementById('formPromo').value) || null,
      stock: parseInt(document.getElementById('formStock').value) || 0,
      warranty: document.getElementById('formWarranty').value.trim(),
      image: document.getElementById('formImage').value.trim() ||
             `assets/${(products.length % 100) + 1}.png`,
      specs: document.getElementById('formSpecs').value.trim(),
      description: document.getElementById('formDescription').value.trim(),
      updatedAt: new Date().toISOString()
    };

    if (id) {
      const idx = products.findIndex(p => p.id === parseInt(id));
      if (idx > -1) products[idx] = { ...products[idx], ...data };
    } else {
      const newId = products.length ? Math.max(...products.map(p => p.id)) + 1 : 1;
      products.push({ id: newId, createdAt: new Date().toISOString(), ...data });
    }

    window.DPEDRO_DB.saveProducts(products);
    closeForm();
    renderAdmin();
    showToast('✅ Produto guardado');

    // sincroniza com ERP
    if (window.ERP_BRIDGE && data.status === 'publicado') {
      window.ERP_BRIDGE.webhookProductPublish(data).catch(() => {});
    }
  }

  function editProduct(id) { openForm(id); }

  function toggleStatus(id) {
    const p = products.find(x => x.id === id);
    if (!p) return;
    p.status = p.status === 'publicado' ? 'rascunho' : 'publicado';
    p.updatedAt = new Date().toISOString();
    window.DPEDRO_DB.saveProducts(products);
    renderAdmin();
    showToast(`Estado: ${p.status}`);
    if (window.ERP_BRIDGE && p.status === 'publicado') {
      window.ERP_BRIDGE.webhookProductPublish(p).catch(() => {});
    }
  }

  function deleteProduct(id) {
    if (!confirm('Eliminar este produto?')) return;
    products = products.filter(p => p.id !== id);
    window.DPEDRO_DB.saveProducts(products);
    renderAdmin();
    showToast('🗑️ Produto eliminado');
  }

  function shareProduct(id) {
    const p = products.find(x => x.id === id);
    if (!p) return;
    p.status = 'partilhado';
    p.shared = true;
    p.updatedAt = new Date().toISOString();
    window.DPEDRO_DB.saveProducts(products);
    renderAdmin();

    const msg = `*${p.name}*\n${window.DPEDRO_DB.fmtKz(p.promo || p.price)}\n\n${p.description || ''}\n\n👉 https://dpedrosolucoes.shop/loja.html#produto-${p.id}`;
    if (navigator.share) {
      navigator.share({ title: p.name, text: msg, url: `https://dpedrosolucoes.shop/loja.html#produto-${p.id}` }).catch(() => {});
    } else {
      navigator.clipboard.writeText(msg).then(() => showToast('📋 Link copiado'));
    }
  }

  // ---------- EXPORT / RESET ----------
  function exportAll() {
    const data = {
      products,
      orders: JSON.parse(localStorage.getItem(STORAGE_ORDERS) || '[]'),
      logs: window.ERP_BRIDGE ? window.ERP_BRIDGE.loadLogs() : []
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'backup-dpedro-' + Date.now() + '.json'; a.click();
    URL.revokeObjectURL(url);
  }

  function resetAll() {
    if (!confirm('⚠️ APAGAR TODOS OS DADOS e restaurar os 100 produtos originais?')) return;
    localStorage.removeItem('dpedro_products_v3');
    localStorage.removeItem(STORAGE_ORDERS);
    if (window.ERP_BRIDGE) window.ERP_BRIDGE.clearLogs();
    products = window.DPEDRO_DB.loadProducts();
    renderAdmin();
    showToast('🔄 Dados restaurados');
  }

  // ---------- ERP TAB ----------
  function renderErp() {
    if (!window.ERP_BRIDGE) return;
    const cfg = window.ERP_BRIDGE.getConfig();
    setVal('erpBaseUrl', cfg.baseURL);
    setVal('erpApiKey', cfg.apiKey);
    setVal('erpStoreId', cfg.storeId);

    const pluginsBox = document.getElementById('erpPlugins');
    if (pluginsBox) {
      pluginsBox.innerHTML = window.ERP_BRIDGE.loadPlugins().map(pl => `
        <div style="display:flex;align-items:center;justify-content:space-between;padding:.8rem;background:var(--bg);border-radius:.6rem;margin-bottom:.5rem;">
          <div style="display:flex;align-items:center;gap:.6rem;">
            <i class="fab ${pl.icon} fa-lg" style="color:var(--primary);"></i>
            <strong>${pl.name}</strong>
          </div>
          <button class="btn ${pl.connected ? 'btn-success' : 'btn-primary'}" style="padding:.4rem 1rem;font-size:.8rem;" onclick="ADMIN.togglePlugin('${pl.id}')">
            ${pl.connected ? '✓ Conectado' : 'Conectar'}
          </button>
        </div>
      `).join('');
    }

    const logsBox = document.getElementById('erpLogs');
    if (logsBox) {
      const logs = window.ERP_BRIDGE.loadLogs().slice(-20).reverse();
      logsBox.innerHTML = logs.length
        ? logs.map(l => `<div style="font-size:.78rem;padding:.4rem .6rem;border-left:3px solid var(--primary);margin-bottom:.3rem;background:var(--bg);">
            <strong>${l.type}</strong> · ${new Date(l.date).toLocaleString('pt-AO')}
          </div>`).join('')
        : '<div style="color:var(--text-muted);font-size:.85rem;">Sem eventos.</div>';
    }
  }
  function setVal(id, v) { const el = document.getElementById(id); if (el) el.value = v || ''; }

  function saveErpConfig() {
    if (!window.ERP_BRIDGE) return;
    window.ERP_BRIDGE.saveConfig({
      baseURL: document.getElementById('erpBaseUrl').value.trim(),
      apiKey: document.getElementById('erpApiKey').value.trim(),
      storeId: document.getElementById('erpStoreId').value.trim()
    });
    showToast('✅ Configuração ERP guardada');
  }
  function togglePlugin(id) {
    if (!window.ERP_BRIDGE) return;
    window.ERP_BRIDGE.togglePlugin(id);
    renderErp();
  }
  function syncProducts() {
    if (!window.ERP_BRIDGE) return;
    window.ERP_BRIDGE.syncProducts().then(r => {
      showToast(`🔄 ${r.total} produtos sincronizados`);
      renderErp();
    });
  }

  // ---------- SWITCH TABS ----------
  function switchTab(tab, btn) {
    document.querySelectorAll('.admin-tab').forEach(t => t.classList.remove('active'));
    btn.classList.add('active');
    document.querySelectorAll('.admin-content').forEach(c => c.style.display = 'none');
    document.getElementById('tab' + tab.charAt(0).toUpperCase() + tab.slice(1)).style.display = 'block';
    if (tab === 'orders') renderOrders();
    if (tab === 'erp') renderErp();
  }

  function renderOrders() {
    let orders = [];
    try { orders = JSON.parse(localStorage.getItem(STORAGE_ORDERS) || '[]'); } catch (e) {}
    const list = document.getElementById('ordersList');
    if (!list) return;
    if (!orders.length) {
      list.innerHTML = '<div style="text-align:center;padding:3rem;color:var(--text-muted);"><i class="fas fa-receipt" style="font-size:3rem;margin-bottom:1rem;display:block;"></i>Nenhum pedido</div>';
      return;
    }
    list.innerHTML = orders.slice().reverse().map(o => `
      <div style="background:var(--bg);padding:1rem;border-radius:var(--radius-sm);margin-bottom:.8rem;">
        <div style="display:flex;justify-content:space-between;margin-bottom:.5rem;flex-wrap:wrap;gap:.5rem;">
          <strong>#${o.id.toString().slice(-6)}</strong>
          <small style="color:var(--text-muted)">${new Date(o.date).toLocaleString('pt-AO')}</small>
          <span style="color:var(--success);font-weight:700;">${window.DPEDRO_DB.fmtKz(o.total)}</span>
          <span style="background:var(--primary);color:#fff;padding:.2rem .6rem;border-radius:20px;font-size:.75rem;">${o.method}</span>
        </div>
        <div style="font-size:.85rem;color:var(--text-muted);">
          ${o.items.map(i => `• ${escapeHtml(i.name)} (x${i.qty}) - ${window.DPEDRO_DB.fmtKz(i.price * i.qty)}`).join('<br>')}
        </div>
      </div>
    `).join('');
  }

  // ---------- INIT ----------
  document.addEventListener('DOMContentLoaded', () => {
    products = window.DPEDRO_DB.loadProducts();
    if (localStorage.getItem('dpedro_admin') === 'true') {
      const ls = document.getElementById('loginScreen');
      const ap = document.getElementById('adminPanel');
      if (ls) ls.style.display = 'none';
      if (ap) ap.style.display = 'block';
      renderAdmin();
    }
    document.getElementById('formModal')?.addEventListener('click', e => {
      if (e.target.id === 'formModal') closeForm();
    });
  });

  window.ADMIN = {
    doLogin, logout, setFilter, setSearch,
    openForm, closeForm, saveForm, editProduct,
    toggleStatus, deleteProduct, shareProduct,
    exportAll, resetAll, switchTab,
    renderErp, saveErpConfig, togglePlugin, syncProducts,
    renderOrders
  };
  window.doLogin = doLogin;
  window.openForm = openForm;
  window.closeForm = closeForm;
  window.saveForm = saveForm;
  window.editProduct = editProduct;
  window.deleteProduct = deleteProduct;
})();