/* =========================================================
   D.PEDRO SOLUÇÕES — ADMIN AVANÇADO
   CRUD + Estados + Partilha + ERP
   ========================================================= */
'use strict';

(function () {
  const STORAGE_ORDERS = 'dpedro_orders';

  let products = [];
  let currentFilter = 'all';
  let currentSearch = '';
  let currentCategoryFilter = 'all';
  let currentSourceFilter = 'all';

  function escapeHtml(s) {
    const d = document.createElement('div'); d.textContent = s || ''; return d.innerHTML;
  }
  function safeImageSrc(value) {
    const src = String(value || '').trim();
    if (src.startsWith('https://') || src.startsWith('http://') || src.startsWith('/') || src.startsWith('./') || src.startsWith('../')) return src;
    return 'assets/1.png';
  }
  function showToast(msg) {
    const t = document.getElementById('toast');
    if (!t) return;
    t.textContent = msg; t.classList.add('show');
    clearTimeout(t._timer);
    t._timer = setTimeout(() => t.classList.remove('show'), 2500);
  }

  // ---------- LOGIN / SESSÃO SEGURA ----------
  function doLogin() {
    window.location.href = 'login.html?next=' + encodeURIComponent('admin.html');
  }
  async function logout() {
    if (window.DPAuth) await window.DPAuth.signOut();
    window.location.replace('login.html');
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
  function setCategoryFilter(v) { currentCategoryFilter = v || 'all'; renderAdmin(); }
  function setSourceFilter(v) { currentSourceFilter = v || 'all'; renderAdmin(); }

  function filteredProducts() {
    return products.filter(p => {
      const matchStatus = currentFilter === 'all' || p.status === currentFilter;
      const matchSearch = !currentSearch || String(p.name || '').toLowerCase().includes(currentSearch) ||
        String(p.brand || '').toLowerCase().includes(currentSearch) || String(p.sku || '').toLowerCase().includes(currentSearch);
      const matchCategory = currentCategoryFilter === 'all' || p.category === currentCategoryFilter;
      const matchSource = currentSourceFilter === 'all' || (p.source || 'manual') === currentSourceFilter;
      return matchStatus && matchSearch && matchCategory && matchSource;
    });
  }

  // ---------- RENDER ----------
  function renderAdmin() {
    products = window.DPEDRO_DB.loadProducts();
    renderOverview();
    const counts = {
      total: products.length,
      publicado: products.filter(p => p.status === 'publicado').length,
      rascunho: products.filter(p => p.status === 'rascunho').length,
      partilhado: products.filter(p => p.status === 'partilhado').length,
      stockOut: products.filter(p => Number(p.stock) <= 0).length
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
      tbody.innerHTML = '<tr><td colspan="8" style="text-align:center;padding:2rem;color:var(--text-muted);">Nenhum produto encontrado. Sincronize o KanawaSoft ou ajuste os filtros.</td></tr>';
      return;
    }
    tbody.innerHTML = list.map(p => {
      const id = JSON.stringify(String(p.id));
      const isKanawa = p.source === 'kanawa';
      const origin = isKanawa ? 'KanawaSoft ERP' : 'Manual';
      const edit = isKanawa ? '' : '<button class="btn-icon-sm" style="background:var(--warning);color:#fff;" onclick="ADMIN.openForm(' + id + ')" title="Editar"><i class="fas fa-edit"></i></button>';
      const remove = isKanawa ? '' : '<button class="btn-icon-sm" style="background:var(--danger);color:#fff;" onclick="ADMIN.deleteProduct(' + id + ')" title="Eliminar"><i class="fas fa-trash"></i></button>';
      return '<tr>' +
        '<td><img src="' + escapeHtml(safeImageSrc(p.image)) + '" loading="lazy" alt="" style="width:44px;height:44px;object-fit:cover;border-radius:6px;"></td>' +
        '<td><strong>' + escapeHtml(p.name) + '</strong><div style="font-size:.75rem;color:var(--text-muted)">' + escapeHtml(p.sku || p.brand || '—') + '</div></td>' +
        '<td>' + escapeHtml(window.DPEDRO_DB.categories.find(c => c.id === p.category)?.name || p.category || '—') + '</td>' +
        '<td><span style="font-size:.78rem;">' + escapeHtml(origin) + '</span></td>' +
        '<td>' + (p.promo ? '<span style="color:var(--warning);font-weight:700">' + window.DPEDRO_DB.fmtKz(p.promo) + '</span>' : window.DPEDRO_DB.fmtKz(p.price)) + '</td>' +
        '<td>' + escapeHtml(String(p.stock)) + '</td>' +
        '<td>' + badgeStatus(p.status) + '</td>' +
        '<td style="white-space:nowrap;">' + edit +
        '<button class="btn-icon-sm" style="background:' + (p.status === 'publicado' ? 'var(--success)' : 'var(--primary)') + ';color:#fff;" onclick="ADMIN.toggleStatus(' + id + ')" title="Publicar/Despublicar"><i class="fas fa-' + (p.status === 'publicado' ? 'eye-slash' : 'eye') + '"></i></button>' +
        '<button class="btn-icon-sm" style="background:#0ea5e9;color:#fff;" onclick="ADMIN.shareProduct(' + id + ')" title="Partilhar"><i class="fas fa-share-alt"></i></button>' + remove + '</td></tr>';
    }).join('');
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

  async function saveForm() {
    const id = document.getElementById('formId').value;
    const existing = id ? products.find(p => String(p.id) === String(id)) : null;
    if (existing?.source === 'kanawa') { alert('Este produto pertence ao KanawaSoft. Altere preço, stock e descrição no ERP e volte a sincronizar.'); return; }
    const name = document.getElementById('formName').value.trim();
    const priceRaw = document.getElementById('formPrice').value.trim();
    const promoRaw = document.getElementById('formPromo').value.trim();
    const stockRaw = document.getElementById('formStock').value.trim();
    const price = Number(priceRaw);
    const promo = promoRaw === '' ? null : Number(promoRaw);
    const stock = stockRaw === '' ? 0 : Number(stockRaw);
    if (name.length < 2) { alert('Introduza um nome de produto com pelo menos 2 caracteres.'); return; }
    if (!Number.isSafeInteger(price) || price <= 0) { alert('O preço deve ser um número inteiro maior que zero.'); return; }
    if (promo !== null && (!Number.isSafeInteger(promo) || promo <= 0 || promo >= price)) { alert('O preço promocional deve ser inteiro, maior que zero e inferior ao preço normal.'); return; }
    if (!Number.isSafeInteger(stock) || stock < 0) { alert('O stock deve ser um número inteiro igual ou superior a zero.'); return; }
    const data = {
      id: existing?.id || crypto.randomUUID(), source: 'manual',
      name, category: document.getElementById('formCategory').value,
      status: document.getElementById('formStatus')?.value || 'rascunho',
      brand: document.getElementById('formBrand').value.trim(), price, promo, stock,
      warranty: document.getElementById('formWarranty').value.trim(),
      image: document.getElementById('formImage').value.trim() || 'assets/1.png',
      specs: document.getElementById('formSpecs').value.trim(),
      description: document.getElementById('formDescription').value.trim(),
      updatedAt: new Date().toISOString(), createdAt: existing?.createdAt || new Date().toISOString()
    };
    if (data.status === 'publicado' && (data.price <= 0 || data.stock <= 0)) {
      alert('Para publicar, o produto precisa de preço válido e stock superior a zero.');
      return;
    }
    try {
      const saved = window.DPS_CLOUD_STORE ? await window.DPS_CLOUD_STORE.saveManual(data) : data;
      const idx = products.findIndex(p => String(p.id) === String(data.id));
      if (idx > -1) products[idx] = saved; else products.push(saved);
      window.DPEDRO_DB.saveProducts(products);
      closeForm(); renderAdmin(); showToast('Produto guardado e sincronizado.');
    } catch (error) { showToast('Não foi possível sincronizar: ' + error.message); }
  }

  function editProduct(id) { openForm(id); }

  async function toggleStatus(id) {
    const p = products.find(x => String(x.id) === String(id));
    if (!p) return;
    const publish = p.status !== 'publicado';
    if (publish && (Number(p.price) <= 0 || Number(p.stock) <= 0)) {
      alert('Só pode publicar produtos com preço válido e stock superior a zero.');
      return;
    }
    try {
      if (window.DPS_CLOUD_STORE) await window.DPS_CLOUD_STORE.setPublished(p.id, publish);
      p.status = publish ? 'publicado' : 'rascunho';
      p.updatedAt = new Date().toISOString();
      window.DPEDRO_DB.saveProducts(products);
      renderAdmin();
      showToast(publish ? 'Produto publicado na loja.' : 'Produto retirado da loja.');
    } catch (error) { showToast('Estado não alterado: ' + error.message); }
  }

  async function deleteProduct(id) {
    const p = products.find(x => String(x.id) === String(id));
    if (!p) return;
    if (p.source === 'kanawa') { alert('Este produto é gerido no KanawaSoft. Desative-o no ERP e sincronize novamente.'); return; }
    if (!confirm('Eliminar este produto da loja?')) return;
    try {
      if (window.DPS_CLOUD_STORE) await window.DPS_CLOUD_STORE.deleteManual(p.id);
      products = products.filter(item => String(item.id) !== String(id));
      window.DPEDRO_DB.saveProducts(products);
      renderAdmin(); showToast('Produto eliminado.');
    } catch (error) { showToast('Não foi possível eliminar: ' + error.message); }
  }

  function shareProduct(id) {
    const p = products.find(x => String(x.id) === String(id));
    if (!p) return;
    if (p.status !== 'publicado') { alert('Publique o produto antes de partilhar o link público.'); return; }
    const msg = '*' + p.name + '*\\n' + window.DPEDRO_DB.fmtKz(p.promo || p.price) +
      '\\n\\n' + (p.description || '') + '\\n\\n👉 https://dpedrosolucoes.shop/#loja';
    const shareUrl = 'https://dpedrosolucoes.shop/#loja';
    if (navigator.share) {
      navigator.share({ title: p.name, text: msg, url: shareUrl }).catch(() => {});
    } else {
      navigator.clipboard.writeText(msg).then(() => showToast('Link copiado')).catch(() => showToast('Não foi possível copiar o link.'));
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

  async function resetAll() {
    if (!confirm('Limpar apenas o cache local deste navegador? Os produtos e pedidos guardados no Supabase NÃO serão apagados.')) return;
    localStorage.removeItem('dpedro_products_v3');
    localStorage.removeItem(STORAGE_ORDERS);
    if (window.ERP_BRIDGE) window.ERP_BRIDGE.clearLogs();
    try {
      if (window.DPS_CLOUD_STORE) {
        await window.DPS_CLOUD_STORE.loadAdminProducts();
        await window.DPS_CLOUD_STORE.loadOrders();
      }
      products = window.DPEDRO_DB.loadProducts();
      renderAdmin(); await renderOrders();
      showToast('Cache local limpo; dados da nuvem recarregados.');
    } catch (error) { showToast('Cache limpo, mas a nuvem não foi recarregada: ' + error.message); }
  }

  // ---------- ERP TAB ----------
  function renderErp() {
    if (!window.ERP_BRIDGE) return;
    const status = document.getElementById('erpConnectionStatus');
    if (status) status.textContent = 'A consultar o estado da API KanawaSoft…';
    if (window.DPS_CLOUD_STORE) {
      window.DPS_CLOUD_STORE.apiStatus().then(result => {
        const integration = result.integration;
        if (status) status.textContent = result.connected && integration
          ? 'API ligada · ' + integration.api_name + ' · Chave ' + integration.api_key_prefix + ' · Endpoint: ' + integration.api_url + ' · Finalidade: ' + integration.purpose + ' · Última consulta: ' + (integration.last_connected_at ? new Date(integration.last_connected_at).toLocaleString('pt-AO') : 'ainda não consultada') + '. Segredo protegido no Supabase Vault.'
          : 'API ainda não ligada. Emita a chave de leitura para começar.';
      }).catch(error => { if (status) status.textContent = 'Estado da API indisponível: ' + error.message; });
    }
    const pluginsBox = document.getElementById('erpPlugins');
    if (pluginsBox) {
      pluginsBox.innerHTML = window.ERP_BRIDGE.loadPlugins().map(pl => `
        <div style="display:flex;align-items:center;justify-content:space-between;padding:.8rem;background:var(--bg);border-radius:.6rem;margin-bottom:.5rem;">
          <div style="display:flex;align-items:center;gap:.6rem;">
            <i class="fab ${pl.icon} fa-lg" style="color:var(--primary);"></i>
            <strong>${escapeHtml(pl.name)}</strong>
          </div>
          <span style="font-size:.8rem;color:var(--text-muted);">${escapeHtml(pl.status)}</span>
        </div>
      `).join('');
    }
    const logsBox = document.getElementById('erpLogs');
    if (logsBox) {
      const logs = window.ERP_BRIDGE.loadLogs().slice(-20).reverse();
      logsBox.innerHTML = logs.length
        ? logs.map(l => `<div style="font-size:.78rem;padding:.4rem .6rem;border-left:3px solid var(--primary);margin-bottom:.3rem;background:var(--bg);">
            <strong>${escapeHtml(l.type)}</strong> · ${new Date(l.date).toLocaleString('pt-AO')}
          </div>`).join('')
        : '<div style="color:var(--text-muted);font-size:.85rem;">Sem eventos.</div>';
    }
  }
  function renderOverview() {
    const items = window.DPEDRO_DB ? window.DPEDRO_DB.loadProducts() : [];
    let orders = [];
    try { orders = JSON.parse(localStorage.getItem(STORAGE_ORDERS) || '[]'); } catch (e) { orders = []; }
    const lowStock = items.filter(p => Number(p.stock) >= 0 && Number(p.stock) <= 5);
    const revenue = orders.reduce((sum, order) => sum + (Number(order.total) || 0), 0);
    setText('overviewProducts', items.length);
    setText('overviewPublished', items.filter(p => p.status === 'publicado').length);
    setText('overviewLowStock', lowStock.length);
    setText('overviewOrders', orders.length);
    setText('overviewRevenue', window.DPEDRO_DB ? window.DPEDRO_DB.fmtKz(revenue) : revenue.toLocaleString('pt-AO') + ' Kz');

    const alerts = [];
    if (!items.length) alerts.push('O catálogo ainda não contém produtos.');
    if (lowStock.length) alerts.push(lowStock.length + ' produto(s) com stock igual ou inferior a 5 unidades.');
    if (!orders.length) alerts.push('Ainda não existem pedidos registados no Supabase.');
    if (!window.DPAuth) alerts.push('Módulo de autenticação não foi carregado; confirme a configuração antes de disponibilizar o painel.');
    const alertBox = document.getElementById('overviewAlerts');
    if (alertBox) alertBox.innerHTML = alerts.length
      ? alerts.map(message => '<div class="admin-list-item"><i class="fas fa-info-circle"></i><span>' + escapeHtml(message) + '</span></div>').join('')
      : '<div class="admin-list-item"><i class="fas fa-check-circle"></i><span>Sem alertas operacionais identificados nos dados sincronizados.</span></div>';

    const activity = items.filter(p => p.updatedAt || p.createdAt)
      .sort((a,b) => new Date(b.updatedAt || b.createdAt) - new Date(a.updatedAt || a.createdAt))
      .slice(0,5);
    const activityBox = document.getElementById('overviewActivity');
    if (activityBox) activityBox.innerHTML = activity.length
      ? activity.map(p => '<div class="admin-list-item"><i class="fas fa-box"></i><span><strong>' + escapeHtml(p.name || 'Produto sem nome') + '</strong><br><small>' + escapeHtml(new Date(p.updatedAt || p.createdAt).toLocaleString('pt-AO')) + ' · ' + escapeHtml(p.status || 'sem estado') + '</small></span></div>').join('')
      : '<p class="admin-muted">Ainda não há atividade de produtos para apresentar.</p>';
  }

  async function refresh() {
    try {
      if (window.DPS_CLOUD_STORE) {
        await window.DPS_CLOUD_STORE.loadAdminProducts();
        await window.DPS_CLOUD_STORE.loadOrders();
      }
      products = window.DPEDRO_DB.loadProducts();
      renderAdmin(); await renderOrders(); renderErp();
      showToast('Dados Supabase atualizados.');
    } catch (error) { showToast('Falha ao atualizar: ' + error.message); }
  }

  function setVal(id, v) { const el = document.getElementById(id); if (el) el.value = v || ''; }

  function saveErpConfig() {
    showToast('Configure as credenciais no Supabase, nunca no navegador.');
  }
  function togglePlugin() {
    showToast('Este conector ainda não tem integração/API validada.');
  }
  async function connectKanawa() {
    const status = document.getElementById('erpConnectionStatus');
    const purpose = document.getElementById('kanawaApiPurpose')?.value || '';
    const apiUrl = document.getElementById('kanawaApiUrl')?.value || '';
    const apiKey = document.getElementById('kanawaApiKey')?.value || '';
    if (status) status.textContent = 'A validar a chave no KanawaSoft e a guardá-la no Supabase Vault…';
    try {
      const result = await window.DPS_CLOUD_STORE.connectKanawa(purpose, apiUrl, apiKey);
      const keyInput = document.getElementById('kanawaApiKey');
      if (keyInput) keyInput.value = '';
      if (status) status.textContent = 'API validada: ' + result.api_name + ' · Chave ' + result.api_key_prefix + '. O segredo foi guardado no Vault e não fica no navegador.';
      showToast('API KanawaSoft validada e guardada com segurança.');
    } catch (error) {
      if (status) status.textContent = 'Não foi possível ligar a API: ' + error.message;
      showToast('Ligação API não concluída: ' + error.message);
    }
  }

  async function syncProducts() {
    const status = document.getElementById('erpConnectionStatus');
    if (status) status.textContent = 'A consultar os produtos ativos do KanawaSoft…';
    try {
      const result = await window.DPS_CLOUD_STORE.syncKanawa();
      products = window.DPEDRO_DB.loadProducts();
      renderAdmin();
      const message = result.total
        ? result.imported + ' produto(s) importado(s)/atualizado(s); ' + result.deactivated + ' desativado(s). Os novos continuam em rascunho.'
        : 'O KanawaSoft não devolveu produtos ativos. Nenhum produto foi publicado ou desativado.';
      if (status) status.textContent = message;
      showToast(message);
      return result;
    } catch (error) {
      if (status) status.textContent = 'Sincronização não concluída: ' + error.message;
      showToast('Falha na sincronização: ' + error.message);
      return null;
    }
  }

  // ---------- SWITCH TABS ----------
  function switchTab(tab, btn) {
    document.querySelectorAll('.admin-tab').forEach(t => { t.classList.remove('active'); t.setAttribute('aria-selected', 'false'); });
    if (btn) { btn.classList.add('active'); btn.setAttribute('aria-selected', 'true'); }
    document.querySelectorAll('.admin-content').forEach(c => c.style.display = 'none');
    const panel = document.getElementById('tab' + tab.charAt(0).toUpperCase() + tab.slice(1));
    if (panel) panel.style.display = 'block';
    if (tab === 'overview') renderOverview();
    if (tab === 'products') renderAdmin();
    if (tab === 'orders') renderOrders();
    if (tab === 'erp') renderErp();
  }

  async function renderOrders() {
    const list = document.getElementById('ordersList');
    if (!list) return;
    let orders = [];
    try {
      orders = window.DPS_CLOUD_STORE ? await window.DPS_CLOUD_STORE.loadOrders() : JSON.parse(localStorage.getItem(STORAGE_ORDERS) || '[]');
    } catch (error) {
      list.innerHTML = '<p class="admin-muted">Não foi possível carregar pedidos partilhados: ' + escapeHtml(error.message) + '</p>';
      return;
    }
    if (!orders.length) {
      list.innerHTML = '<div style="text-align:center;padding:3rem;color:var(--text-muted);"><i class="fas fa-receipt" style="font-size:3rem;margin-bottom:1rem;display:block;"></i>Nenhum pedido registado.</div>';
      return;
    }
    list.innerHTML = orders.map(o => '<div style="background:var(--bg);padding:1rem;border-radius:var(--radius-sm);margin-bottom:.8rem;">' +
      '<div style="display:flex;justify-content:space-between;margin-bottom:.5rem;flex-wrap:wrap;gap:.5rem;">' +
      '<strong>#' + escapeHtml(o.order_number || o.id) + '</strong>' +
      '<small style="color:var(--text-muted)">' + escapeHtml(new Date(o.date).toLocaleString('pt-AO')) + '</small>' +
      '<span style="color:var(--success);font-weight:700;">' + window.DPEDRO_DB.fmtKz(o.total) + '</span>' +
      '<span>' + escapeHtml(o.status || 'pending') + ' · ' + escapeHtml(o.payment_status || 'not_paid') + '</span></div>' +
      '<div style="font-size:.85rem;color:var(--text-muted);">' +
      (o.items || []).map(i => '• ' + escapeHtml(i.name) + ' (x' + escapeHtml(String(i.qty)) + ') - ' + window.DPEDRO_DB.fmtKz(Number(i.price) * Number(i.qty))).join('<br>') +
      '</div></div>').join('');
  }

  // ---------- INIT ----------
  document.addEventListener('DOMContentLoaded', async () => {
    products = window.DPEDRO_DB.loadProducts();
    const allowed = window.DPAuth ? await window.DPAuth.requireAdmin() : false;
    if (allowed) {
      const ls = document.getElementById('loginScreen');
      const ap = document.getElementById('adminPanel');
      if (ls) ls.style.display = 'none';
      if (ap) ap.style.display = 'block';
      try {
        if (window.DPS_CLOUD_STORE) await window.DPS_CLOUD_STORE.initializeAdmin();
        products = window.DPEDRO_DB.loadProducts();
        await window.DPS_CLOUD_STORE?.loadOrders();
      } catch (error) { showToast('A nuvem não foi carregada: ' + error.message); }
      const overviewTab = document.querySelector('.admin-tab[onclick*="overview"]');
      switchTab('overview', overviewTab);
    }
    window.addEventListener('dpedro:products-updated', event => {
      products = Array.isArray(event.detail) ? event.detail : window.DPEDRO_DB.loadProducts();
      renderAdmin();
    });
    document.getElementById('formModal')?.addEventListener('click', e => {
      if (e.target.id === 'formModal') closeForm();
    });
  });

  window.ADMIN = {
    doLogin, logout, setFilter, setSearch, setCategoryFilter, setSourceFilter,
    openForm, closeForm, saveForm, editProduct,
    toggleStatus, deleteProduct, shareProduct,
    exportAll, resetAll, switchTab,
    renderErp, saveErpConfig, togglePlugin, connectKanawa, syncProducts,
    renderOrders, renderOverview, refresh
  };
  window.doLogin = doLogin;
  window.openForm = openForm;
  window.closeForm = closeForm;
  window.saveForm = saveForm;
  window.editProduct = editProduct;
  window.deleteProduct = deleteProduct;
})();