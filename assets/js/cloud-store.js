/* D.PEDRO SOLUÇÕES — catálogo e pedidos partilhados via Supabase */
'use strict';
(function () {
  const cfg = window.DPEDRO_SUPABASE_CONFIG;
  const STORE = 'dpedrosolucoes';
  const API = cfg?.url ? cfg.url.replace(/\/$/, '') + '/functions/v1/dps-store-bridge' : '';
  let companyId = null;
  let channel = null;
  let adminReady = false;

  function localProduct(row) {
    return {
      id: row.id, source: row.source || 'manual', sourceProductId: row.source_product_id || null,
      sku: row.sku || '', name: row.name || '', brand: row.brand || '',
      category: row.category || 'informatica', unit: row.unit || 'UN',
      description: row.description || '', specs: row.specs || '',
      image: row.image_url || 'assets/1.png', price: Number(row.price) || 0,
      promo: row.promo_price == null ? null : Number(row.promo_price),
      stock: Number(row.stock_quantity) || 0, status: row.is_published ? 'publicado' : 'rascunho',
      warranty: '', createdAt: row.created_at, updatedAt: row.updated_at,
      isActive: row.is_active !== false
    };
  }
  function cacheProducts(rows) {
    const products = (rows || []).filter(row => row.is_active !== false).map(localProduct);
    window.DPEDRO_DB?.saveProducts?.(products);
    window.dispatchEvent(new CustomEvent('dpedro:products-updated', { detail: products }));
    return products;
  }
  async function publicProducts() {
    if (!API) return [];
    try {
      const response = await fetch(API + '?action=public-products&store=' + encodeURIComponent(STORE), { headers: { Accept: 'application/json' } });
      const result = await response.json().catch(() => ({}));
      if (!response.ok || result.ok !== true) throw new Error(result.error || 'Não foi possível carregar o catálogo publicado.');
      const products = (result.products || []).filter(row => row.is_active !== false).map(localProduct);
      localStorage.setItem('dpedro_store_public_cache', JSON.stringify(products));
      window.dispatchEvent(new CustomEvent('dpedro:products-updated', { detail: products }));
      return products;
    } catch (error) {
      let cached = [];
      try { cached = JSON.parse(localStorage.getItem('dpedro_store_public_cache') || '[]'); } catch (_) {}
      window.dispatchEvent(new CustomEvent('dpedro:products-updated', { detail: cached }));
      return cached;
    }
  }
  async function invoke(action, payload = {}) {
    if (!window.DPAuth?.client) throw new Error('Sessão Supabase indisponível.');
    const { data, error } = await window.DPAuth.client.functions.invoke('dps-store-bridge', { body: { action, company_id: companyId, ...payload } });
    if (error) throw new Error(error.message || 'Falha na comunicação com o servidor.');
    if (!data?.ok) throw new Error(data?.error || 'O servidor não confirmou a operação.');
    return data;
  }
  async function loadAdminProducts() {
    if (!window.DPAuth?.client || !companyId) throw new Error('A sessão administrativa não está preparada.');
    const { data, error } = await window.DPAuth.client.from('dps_store_products')
      .select('*').eq('company_id', companyId).order('name');
    if (error) throw new Error(error.message || 'Não foi possível carregar os produtos partilhados.');
    return cacheProducts(data || []);
  }
  async function loadOrders() {
    if (!window.DPAuth?.client || !companyId) return [];
    const { data, error } = await window.DPAuth.client.from('dps_store_orders')
      .select('id,order_number,status,payment_status,payment_method,total,created_at,dps_store_order_items(product_name,quantity,unit_price,line_total)')
      .eq('company_id', companyId).order('created_at', { ascending: false }).limit(200);
    if (error) throw new Error(error.message || 'Não foi possível carregar os pedidos partilhados.');
    const orders = (data || []).map(o => ({
      id: o.id, order_number: o.order_number, status: o.status,
      payment_status: o.payment_status, method: o.payment_method,
      total: Number(o.total) || 0, date: o.created_at,
      items: (o.dps_store_order_items || []).map(i => ({
        name: i.product_name, qty: Number(i.quantity), price: Number(i.unit_price)
      }))
    }));
    localStorage.setItem('dpedro_orders', JSON.stringify(orders));
    window.dispatchEvent(new CustomEvent('dpedro:orders-updated', { detail: orders }));
    return orders;
  }
  async function initializeAdmin() {
    if (adminReady) return true;
    if (!window.DPAuth?.client) throw new Error('Autenticação Supabase não carregada.');
    const membership = await window.DPAuth.getActiveMembership();
    if (!membership?.company_id) throw new Error('A conta não tem uma empresa ativa associada.');
    companyId = membership.company_id;
    await loadAdminProducts();
    await loadOrders();
    if (channel) await window.DPAuth.client.removeChannel(channel);
    channel = window.DPAuth.client.channel('dps-store-' + companyId)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'dps_store_products', filter: 'company_id=eq.' + companyId }, () => loadAdminProducts().catch(console.error))
      .on('postgres_changes', { event: '*', schema: 'public', table: 'dps_store_orders', filter: 'company_id=eq.' + companyId }, () => loadOrders().catch(console.error))
      .subscribe();
    adminReady = true;
    return true;
  }
  async function connectKanawa(purpose) {
    if (!companyId) await initializeAdmin();
    const cleanPurpose = String(purpose || '').trim();
    if (cleanPurpose.length < 5) throw new Error('Descreva a finalidade da ligação à loja.');
    const previous = await apiStatus().catch(() => null);
    const previousKeyId = previous?.integration?.api_key_id || null;
    const apiName = 'D.PEDRO SOLUÇÕES e-Commerce';
    const origins = ['https://dpedrosolucoes.shop','https://www.dpedrosolucoes.shop','https://dpedrosolucoeslda.netlify.app'];
    const { data: issued, error: issueError } = await window.DPAuth.client.functions.invoke('ks-store-api', {
      body: { action: 'create-key', company_id: companyId, name: apiName, purpose: cleanPurpose, allowed_origins: origins }
    });
    if (issueError || !issued?.success || !issued?.secret || !issued?.key?.id) {
      throw new Error(issued?.error || issueError?.message || 'O KanawaSoft não conseguiu emitir uma chave de catálogo.');
    }
    const { data: saved, error: saveError } = await window.DPAuth.client.functions.invoke('dps-store-bridge', {
      body: {
        action: 'configure-api', company_id: companyId, api_name: apiName,
        purpose: cleanPurpose, api_key_id: issued.key.id,
        api_key_prefix: issued.key.key_prefix, api_secret: issued.secret
      }
    });
    if (saveError || !saved?.ok) {
      await window.DPAuth.client.functions.invoke('ks-store-api', {
        body: { action: 'revoke-key', company_id: companyId, key_id: issued.key.id }
      }).catch(() => {});
      throw new Error(saved?.error || saveError?.message || 'A chave foi emitida, mas não ficou guardada no cofre seguro.');
    }
    if (previousKeyId && previousKeyId !== issued.key.id) {
      await window.DPAuth.client.functions.invoke('ks-store-api', {
        body: { action: 'revoke-key', company_id: companyId, key_id: previousKeyId }
      }).catch(() => {});
    }
    return saved;
  }
  async function apiStatus() {
    if (!companyId) await initializeAdmin();
    return await invoke('api-status');
  }
  async function syncKanawa() {
    if (!companyId) await initializeAdmin();
    const result = await invoke('sync-kanawa');
    await loadAdminProducts();
    return result;
  }
  async function setPublished(id, published) {
    if (!companyId) await initializeAdmin();
    const result = await invoke('set-published', { product_id: id, is_published: published === true });
    await loadAdminProducts();
    return result;
  }
  async function saveManual(product) {
    if (!companyId) await initializeAdmin();
    const id = product.id || crypto.randomUUID();
    const row = {
      id, company_id: companyId, source: 'manual', source_product_id: 'manual:' + id,
      sku: product.sku || null, name: product.name, brand: product.brand || null,
      category: product.category || null, unit: product.unit || 'UN',
      description: product.description || null, specs: product.specs || null,
      image_url: product.image || null, price: Number(product.price) || 0,
      promo_price: product.promo == null ? null : Number(product.promo),
      stock_quantity: Number(product.stock) || 0,
      is_published: product.status === 'publicado', is_active: true
    };
    const { data, error } = await window.DPAuth.client.from('dps_store_products')
      .upsert(row, { onConflict: 'id' }).select('*').single();
    if (error) throw new Error(error.message || 'Não foi possível guardar o produto na nuvem.');
    await loadAdminProducts();
    return localProduct(data);
  }
  async function deleteManual(id) {
    if (!companyId) await initializeAdmin();
    const { error } = await window.DPAuth.client.from('dps_store_products')
      .delete().eq('company_id', companyId).eq('id', id).eq('source', 'manual');
    if (error) throw new Error(error.message || 'Não foi possível eliminar o produto.');
    await loadAdminProducts();
    return true;
  }
  async function createOrder(method, items) {
    if (!API) throw new Error('Serviço da loja indisponível.');
    const response = await fetch(API, {
      method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({ action: 'create-order', store_slug: STORE, payment_method: method, items: items.map(i => ({ product_id: String(i.id), quantity: Number(i.qty) })) })
    });
    const result = await response.json().catch(() => ({}));
    if (!response.ok || result.ok !== true) {
      const error = new Error(result.error || 'Não foi possível registar o pedido.');
      error.status = response.status;
      throw error;
    }
    return result.order;
  }
  function queueOrder(method, items) {
    const key = 'dpedro_orders_pending';
    let queue = [];
    try { queue = JSON.parse(localStorage.getItem(key) || '[]'); } catch (_) {}
    const localRef = 'LOCAL-' + Date.now();
    queue.push({ local_ref: localRef, method, items, queued_at: new Date().toISOString() });
    localStorage.setItem(key, JSON.stringify(queue.slice(-100)));
    return localRef;
  }
  async function retryPendingOrders() {
    let queue = [];
    try { queue = JSON.parse(localStorage.getItem('dpedro_orders_pending') || '[]'); } catch (_) {}
    if (!queue.length) return 0;
    const remaining = [];
    let sent = 0;
    for (const pending of queue) {
      try { await createOrder(pending.method, pending.items); sent++; }
      catch (error) { remaining.push(pending); }
    }
    localStorage.setItem('dpedro_orders_pending', JSON.stringify(remaining));
    return sent;
  }
  window.addEventListener('online', () => retryPendingOrders().catch(() => {}));
  document.addEventListener('DOMContentLoaded', () => {
    if (window.DPAuth?.client) return;
    publicProducts().catch(error => {
      console.warn('[DPS Store] Catálogo online indisponível:', error.message);
      window.dispatchEvent(new CustomEvent('dpedro:products-updated', { detail: [] }));
    });
    retryPendingOrders().catch(() => {});
  });
  window.DPS_CLOUD_STORE = Object.freeze({
    initializeAdmin, loadAdminProducts, loadOrders, connectKanawa, apiStatus, syncKanawa,
    setPublished, saveManual, deleteManual, createOrder, queueOrder,
    retryPendingOrders, publicProducts, get companyId() { return companyId; },
    get ready() { return adminReady; }
  });
})();