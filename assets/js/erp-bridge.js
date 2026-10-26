/* =========================================================
   D.PEDRO SOLUÇÕES — ERP BRIDGE (API + Webhooks + Plugins)
   Liga o e-commerce ao KanawaSoft ERP
   ========================================================= */
'use strict';

(function () {
  const ERP_CONFIG = {
    baseURL: localStorage.getItem('erp_base_url') || 'https://api.kanawasoft.ao/v1',
    apiKey: localStorage.getItem('erp_api_key') || '',
    storeId: localStorage.getItem('erp_store_id') || 'DPEDRO-LDA-001',
    autoSync: localStorage.getItem('erp_auto_sync') !== 'false',
    webhooks: {
      onProductPublish: '/webhooks/product/published',
      onOrderCreate:    '/webhooks/order/created',
      onOrderPaid:      '/webhooks/order/paid',
      onStockChange:    '/webhooks/stock/changed'
    }
  };

  const PLUGINS = [
    { id:'woocommerce', name:'WooCommerce',    icon:'fa-wordpress',  connected:false },
    { id:'shopify',     name:'Shopify',        icon:'fa-shopify',    connected:false },
    { id:'kanawa',      name:'KanawaSoft ERP', icon:'fa-desktop',    connected:false },
    { id:'saft',        name:'SAFT-AO (AGT)',  icon:'fa-file-invoice',connected:false },
    { id:'stripe',      name:'Stripe',         icon:'fa-credit-card',connected:false },
    { id:'multicaixa',  name:'Multicaixa',     icon:'fa-money-bill', connected:false },
    { id:'whatsapp',    name:'WhatsApp Cloud', icon:'fa-whatsapp',   connected:false },
    { id:'google-sheets',name:'Google Sheets', icon:'fa-table',      connected:false }
  ];

  function loadPlugins() {
    try {
      const saved = JSON.parse(localStorage.getItem('erp_plugins') || '[]');
      return PLUGINS.map(p => ({ ...p, connected: saved.includes(p.id) }));
    } catch (e) { return PLUGINS; }
  }
  function savePlugins(list) {
    localStorage.setItem('erp_plugins', JSON.stringify(list.filter(p => p.connected).map(p => p.id)));
  }
  function togglePlugin(id) {
    const list = loadPlugins();
    const p = list.find(x => x.id === id);
    if (p) p.connected = !p.connected;
    savePlugins(list);
    return list;
  }

  function buildHeaders() {
    return {
      'Content-Type': 'application/json',
      'X-Store-Id': ERP_CONFIG.storeId,
      'X-Api-Key': ERP_CONFIG.apiKey,
      'X-Client': 'D.PEDRO-ECOMMERCE'
    };
  }

  async function apiCall(endpoint, method = 'GET', body = null) {
    const url = ERP_CONFIG.baseURL + endpoint;
    const opts = { method, headers: buildHeaders() };
    if (body) opts.body = JSON.stringify(body);

    // Simulação offline (não há servidor real)
    if (!ERP_CONFIG.apiKey) {
      return {
        ok: true,
        simulated: true,
        endpoint,
        method,
        body,
        timestamp: new Date().toISOString()
      };
    }

    try {
      const res = await fetch(url, opts);
      return await res.json();
    } catch (e) {
      return { ok: false, error: e.message, endpoint };
    }
  }

  // ================= Webhooks =================
  async function webhookProductPublish(product) {
    return apiCall(ERP_CONFIG.webhooks.onProductPublish, 'POST', {
      id: product.id,
      name: product.name,
      price: product.promo || product.price,
      stock: product.stock,
      category: product.category,
      status: product.status
    });
  }
  async function webhookOrderCreate(order) {
    return apiCall(ERP_CONFIG.webhooks.onOrderCreate, 'POST', order);
  }
  async function webhookOrderPaid(order) {
    return apiCall(ERP_CONFIG.webhooks.onOrderPaid, 'POST', order);
  }
  async function webhookStockChange(product) {
    return apiCall(ERP_CONFIG.webhooks.onStockChange, 'POST', {
      id: product.id, stock: product.stock
    });
  }

  // ================= Sincronização =================
  async function syncProducts() {
    const products = window.DPEDRO_DB.loadProducts();
    const published = products.filter(p => p.status === 'publicado');
    const results = [];
    for (const p of published) {
      results.push(await webhookProductPublish(p));
    }
    logEvent('sync_products', { total: published.length });
    return { ok: true, total: published.length, results };
  }

  function logEvent(type, data) {
    try {
      const logs = JSON.parse(localStorage.getItem('erp_logs') || '[]');
      logs.push({ type, data, date: new Date().toISOString() });
      localStorage.setItem('erp_logs', JSON.stringify(logs.slice(-200)));
    } catch (e) {}
  }
  function loadLogs() {
    try { return JSON.parse(localStorage.getItem('erp_logs') || '[]'); } catch (e) { return []; }
  }
  function clearLogs() { localStorage.removeItem('erp_logs'); }

  // ================= Config =================
  function saveConfig(cfg) {
    Object.keys(cfg).forEach(k => {
      localStorage.setItem('erp_' + k, cfg[k]);
      ERP_CONFIG[k] = cfg[k];
    });
  }
  function getConfig() { return { ...ERP_CONFIG }; }

  window.ERP_BRIDGE = {
    getConfig, saveConfig,
    loadPlugins, togglePlugin,
    apiCall,
    webhookProductPublish,
    webhookOrderCreate,
    webhookOrderPaid,
    webhookStockChange,
    syncProducts,
    loadLogs, clearLogs
  };
})();