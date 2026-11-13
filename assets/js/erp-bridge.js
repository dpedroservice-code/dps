/* D.PEDRO SOLUÇÕES — integração ERP server-side.
 * Nenhuma chave privada fica no browser. Sem configuração/endpoint real, a operação falha.
 */
'use strict';

(function () {
  const PLUGINS = [
    { id:'woocommerce', name:'WooCommerce', icon:'fa-wordpress' },
    { id:'shopify', name:'Shopify', icon:'fa-shopify' },
    { id:'kanawa', name:'KanawaSoft ERP', icon:'fa-desktop' },
    { id:'saft', name:'SAFT-AO (AGT)', icon:'fa-file-invoice' },
    { id:'stripe', name:'Stripe', icon:'fa-credit-card' },
    { id:'multicaixa', name:'Multicaixa', icon:'fa-money-bill' },
    { id:'whatsapp', name:'WhatsApp Cloud', icon:'fa-whatsapp' },
    { id:'google-sheets', name:'Google Sheets', icon:'fa-table' }
  ];

  function loadPlugins() {
    return PLUGINS.map(plugin => ({ ...plugin, connected: false, status: 'Não configurado' }));
  }

  function togglePlugin() {
    return loadPlugins();
  }

  async function apiCall(event, payload) {
    if (!window.DPAuth?.client) {
      return { ok: false, error: 'Autenticação Supabase indisponível.' };
    }
    try {
      const membership = await window.DPAuth.getActiveMembership();
      if (!membership) return { ok: false, error: 'Não existe uma associação ativa a uma empresa.' };
      const { data, error } = await window.DPAuth.client.functions.invoke('ks-erp-proxy', {
        body: { company_id: membership.company_id, event, payload }
      });
      if (error) return { ok: false, error: error.message || 'Falha ao chamar a função ERP.' };
      if (!data?.ok) return { ok: false, error: data?.error || 'A integração ERP não confirmou a operação.', details: data };
      logEvent(event, { company_id: membership.company_id, ok: true, upstream_status: data.upstream_status });
      return data;
    } catch (error) {
      return { ok: false, error: error?.message || 'Erro inesperado na integração ERP.' };
    }
  }

  async function webhookProductPublish(product) {
    return apiCall('product.published', {
      id: product.id, name: product.name, price: product.promo || product.price,
      stock: product.stock, category: product.category, status: product.status
    });
  }

  async function webhookOrderCreate(order) {
    return apiCall('order.created', order);
  }

  async function webhookOrderPaid(order) {
    return apiCall('order.paid', order);
  }

  async function webhookStockChange(product) {
    return apiCall('stock.changed', { id: product.id, stock: product.stock });
  }

  async function syncProducts() {
    const products = window.DPEDRO_DB?.loadProducts?.() || [];
    const published = products.filter(product => product.status === 'publicado');
    const results = [];
    for (const product of published) results.push(await webhookProductPublish(product));
    const succeeded = results.filter(result => result?.ok === true).length;
    const failed = results.length - succeeded;
    logEvent('sync_products', { total: published.length, succeeded, failed });
    return { ok: failed === 0, total: published.length, succeeded, failed, results };
  }

  function logEvent(type, data) {
    try {
      const logs = JSON.parse(localStorage.getItem('erp_logs') || '[]');
      logs.push({ type, data, date: new Date().toISOString() });
      localStorage.setItem('erp_logs', JSON.stringify(logs.slice(-200)));
    } catch (_) {}
  }

  function loadLogs() {
    try { return JSON.parse(localStorage.getItem('erp_logs') || '[]'); } catch (_) { return []; }
  }

  function clearLogs() {
    localStorage.removeItem('erp_logs');
  }

  function getConfig() {
    return { serverManaged: true, configuredInBrowser: false };
  }

  function saveConfig() {
    throw new Error('As credenciais ERP são configuradas apenas nos segredos server-side do Supabase.');
  }

  window.ERP_BRIDGE = {
    getConfig, saveConfig, loadPlugins, togglePlugin, apiCall,
    webhookProductPublish, webhookOrderCreate, webhookOrderPaid,
    webhookStockChange, syncProducts, loadLogs, clearLogs
  };
})();
