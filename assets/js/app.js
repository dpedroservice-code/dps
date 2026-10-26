/* =========================================================
   D.PEDRO SOLUÇÕES — SPA + LOJA (100 PRODUTOS)
   ========================================================= */
'use strict';

(function () {
  let products = [];
  let currentCategory = 'all';
  let showOnlyOffers = false;
  let currentDetailProduct = null;
  let currentQty = 1;

  function escapeHtml(s) {
    const d = document.createElement('div'); d.textContent = s || ''; return d.innerHTML;
  }

  // ============ NAVEGAÇÃO SPA ============
  function navigate(page) {
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    const target = document.getElementById('page-' + page);
    if (target) target.classList.add('active');
    document.querySelectorAll('.nav-menu > li > a').forEach(a => a.classList.remove('active'));
    const link = document.querySelector(`.nav-link[data-page="${page}"]`);
    if (link) link.classList.add('active');
    window.scrollTo({ top: 0, behavior: 'smooth' });
    if (page === 'loja') { renderCategories(); filterProducts(); }
    if (page === 'inicio') renderFeatured();
  }

  // ============ DESTAQUES ============
  function renderFeatured() {
    const grid = document.getElementById('featuredProducts');
    if (!grid) return;
    const featured = products.filter(p => p.status === 'publicado' && p.promo && p.promo < p.price).slice(0, 8);
    grid.innerHTML = featured.map(productCardHTML).join('');
  }

  // ============ CATEGORIAS ============
  function renderCategories() {
    const grid = document.getElementById('categoriesGrid');
    if (!grid) return;
    grid.innerHTML = window.DPEDRO_DB.categories.map(c => `
      <div class="category-card ${c.id === currentCategory ? 'active' : ''}" onclick="setCategory('${c.id}')">
        <i class="fas ${c.icon}"></i><span>${c.name}</span>
      </div>
    `).join('');
  }

  function setCategory(cat) {
    currentCategory = cat;
    showOnlyOffers = false;
    document.getElementById('btnOfertas')?.classList.remove('active');
    renderCategories();
    filterProducts();
  }

  function toggleOfertas() {
    showOnlyOffers = !showOnlyOffers;
    document.getElementById('btnOfertas')?.classList.toggle('active', showOnlyOffers);
    filterProducts();
  }

  // ============ PRODUTOS ============
  function productCardHTML(p) {
    const price = p.promo || p.price;
    const hasPromo = p.promo && p.promo < p.price;
    const inStock = p.stock > 0;
    const catName = window.DPEDRO_DB.categories.find(c => c.id === p.category)?.name || p.category;
    return `
      <div class="product-card">
        <div class="product-image" onclick="openDetail(${p.id})">
          <img src="${p.image}" alt="${escapeHtml(p.name)}" loading="lazy" onerror="this.src='assets/1.png'">
          ${hasPromo ? '<span class="product-badge promo">PROMO</span>' : ''}
          ${!inStock ? '<span class="product-badge out">ESGOTADO</span>' : ''}
        </div>
        <div class="product-info">
          <div class="product-cat">${catName}</div>
          <h3 class="product-name" onclick="openDetail(${p.id})">${escapeHtml(p.name)}</h3>
          <p class="product-specs">${escapeHtml(p.specs || '')}</p>
          <div class="product-price">
            <span class="current">${window.DPEDRO_DB.fmtKz(price)}</span>
            ${hasPromo ? `<span class="old">${window.DPEDRO_DB.fmtKz(p.price)}</span>` : ''}
          </div>
          <div class="product-stock ${inStock ? 'in' : 'out'}">
            <i class="fas fa-${inStock ? 'check-circle' : 'times-circle'}"></i>
            ${inStock ? `Stock: ${p.stock}` : 'Esgotado'}
          </div>
          <div class="product-actions">
            <button class="btn-add-cart" onclick="addToCart(${p.id},1)" ${!inStock ? 'disabled' : ''}>
              <i class="fas fa-cart-plus"></i> Adicionar
            </button>
            <button class="btn-view" onclick="openDetail(${p.id})">
              <i class="fas fa-eye"></i>
            </button>
          </div>
        </div>
      </div>
    `;
  }

  function filterProducts() {
    const grid = document.getElementById('productsGrid');
    if (!grid) return;
    const search = (document.getElementById('searchInput')?.value || '').toLowerCase();
    const sort = document.getElementById('sortSelect')?.value || 'default';
    let filtered = products.filter(p => {
      const isPublished = p.status === 'publicado';
      const matchCat = currentCategory === 'all' || p.category === currentCategory;
      const matchSearch = p.name.toLowerCase().includes(search) || (p.specs || '').toLowerCase().includes(search);
      const matchOffer = !showOnlyOffers || (p.promo && p.promo < p.price);
      return isPublished && matchCat && matchSearch && matchOffer;
    });
    if (sort === 'price-asc')  filtered.sort((a, b) => (a.promo || a.price) - (b.promo || b.price));
    if (sort === 'price-desc') filtered.sort((a, b) => (b.promo || b.price) - (a.promo || a.price));
    if (sort === 'name')       filtered.sort((a, b) => a.name.localeCompare(b.name));
    if (!filtered.length) {
      grid.innerHTML = '<div style="grid-column:1/-1;text-align:center;padding:3rem;color:var(--text-muted);"><i class="fas fa-search" style="font-size:3rem;margin-bottom:1rem;display:block;"></i>Nenhum produto encontrado.</div>';
      return;
    }
    grid.innerHTML = filtered.map(productCardHTML).join('');
  }

  // ============ DETALHE ============
  function openDetail(id) {
    const p = products.find(x => x.id === id);
    if (!p) return;
    currentDetailProduct = p;
    currentQty = 1;
    const price = p.promo || p.price;
    const hasPromo = p.promo && p.promo < p.price;
    const inStock = p.stock > 0;
    const catName = window.DPEDRO_DB.categories.find(c => c.id === p.category)?.name || p.category;

    if (typeof gtag === 'function') gtag('event', 'view_item', { item_name: p.name, value: price });

    document.getElementById('productDetail').innerHTML = `
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:2rem;">
        <div style="border-radius:1rem;overflow:hidden;aspect-ratio:1;background:var(--bg);">
          <img src="${p.image}" alt="${escapeHtml(p.name)}" style="width:100%;height:100%;object-fit:cover;" onerror="this.src='assets/1.png'">
        </div>
        <div>
          <div style="color:var(--primary);font-weight:600;font-size:.85rem;text-transform:uppercase;margin-bottom:.8rem;">${catName}</div>
          <h2 style="font-size:1.6rem;margin-bottom:.5rem;">${escapeHtml(p.name)}</h2>
          ${p.brand ? `<div style="color:var(--text-muted);font-size:.9rem;margin-bottom:1rem;">Marca: <strong>${escapeHtml(p.brand)}</strong></div>` : ''}
          <div style="display:flex;align-items:baseline;gap:1rem;margin:1.2rem 0;">
            <span style="font-size:2rem;font-weight:800;color:var(--success);">${window.DPEDRO_DB.fmtKz(price)}</span>
            ${hasPromo ? `<span style="font-size:1rem;color:var(--text-muted);text-decoration:line-through;">${window.DPEDRO_DB.fmtKz(p.price)}</span>` : ''}
          </div>
          <div style="margin-bottom:1rem;font-size:.9rem;color:${inStock ? 'var(--success)' : 'var(--danger)'};">
            <i class="fas fa-${inStock ? 'check-circle' : 'times-circle'}"></i>
            ${inStock ? `Em stock (${p.stock} unidades)` : 'Esgotado'}
          </div>
          ${p.specs ? `<div style="background:var(--bg);padding:.8rem;border-radius:.6rem;margin-bottom:1rem;font-size:.88rem;"><strong>Especificações:</strong> ${escapeHtml(p.specs)}</div>` : ''}
          ${p.description ? `<p style="color:var(--text-muted);font-size:.9rem;margin-bottom:1rem;">${escapeHtml(p.description)}</p>` : ''}
          ${p.warranty ? `<div style="font-size:.85rem;color:var(--text-muted);margin-bottom:1rem;"><i class="fas fa-shield-alt"></i> Garantia: ${escapeHtml(p.warranty)}</div>` : ''}
          ${inStock ? `
            <div style="display:flex;align-items:center;gap:1rem;margin-bottom:1.2rem;">
              <span style="font-weight:600;">Qtd:</span>
              <button onclick="changeDetailQty(-1)" style="width:36px;height:36px;border-radius:50%;border:2px solid var(--border);background:var(--card);cursor:pointer;font-size:1.1rem;font-weight:700;color:var(--primary);">−</button>
              <span id="detailQtyDisplay" style="font-size:1.1rem;font-weight:700;min-width:36px;text-align:center;">1</span>
              <button onclick="changeDetailQty(1)" style="width:36px;height:36px;border-radius:50%;border:2px solid var(--border);background:var(--card);cursor:pointer;font-size:1.1rem;font-weight:700;color:var(--primary);">+</button>
            </div>
            <div style="display:flex;gap:.5rem;flex-wrap:wrap;">
              <button class="btn btn-primary" onclick="addDetailToCart()" style="flex:1;"><i class="fas fa-cart-plus"></i> Adicionar</button>
              <button class="btn btn-success" onclick="buyDetailNow()" style="flex:1;"><i class="fab fa-whatsapp"></i> Comprar</button>
            </div>
          ` : `
            <div style="background:#fef2f2;padding:1rem;border-radius:.6rem;color:#991b1b;margin:1rem 0;"><i class="fas fa-info-circle"></i> Esgotado. Contacte-nos!</div>
            <a href="https://wa.me/244946299834?text=${encodeURIComponent('Olá, quando estará disponível ' + p.name + '?')}" target="_blank" class="btn btn-success btn-block"><i class="fab fa-whatsapp"></i> Perguntar Disponibilidade</a>
          `}
        </div>
      </div>
    `;
    document.getElementById('productModal').classList.add('active');
  }

  function changeDetailQty(delta) {
    if (!currentDetailProduct) return;
    currentQty = Math.max(1, Math.min(currentDetailProduct.stock, currentQty + delta));
    document.getElementById('detailQtyDisplay').textContent = currentQty;
  }
  function addDetailToCart() {
    if (!currentDetailProduct) return;
    addToCart(currentDetailProduct.id, currentQty);
    closeProduct();
  }
  function buyDetailNow() {
    if (!currentDetailProduct) return;
    const p = currentDetailProduct;
    const price = p.promo || p.price;
    const msg = `*PEDIDO - D.PEDRO*\n\n*Produto:* ${p.name}\n*Qtd:* ${currentQty}\n*Preço:* ${window.DPEDRO_DB.fmtKz(price)}\n*Total:* ${window.DPEDRO_DB.fmtKz(price * currentQty)}\n\nAguardo confirmação.`;
    if (typeof gtag === 'function') gtag('event', 'purchase', { value: price * currentQty, currency: 'AOA' });
    window.open(`https://wa.me/244946299834?text=${encodeURIComponent(msg)}`, '_blank');
  }
  function closeProduct() {
    document.getElementById('productModal').classList.remove('active');
    currentDetailProduct = null;
  }

  // ============ INIT ============
  document.addEventListener('DOMContentLoaded', () => {
    products = window.DPEDRO_DB.loadProducts();
    if (localStorage.getItem('dpedro_theme') === 'dark') document.body.classList.add('dark');
    renderFeatured();
    renderCategories();
    filterProducts();
    // Contadores
    document.querySelectorAll('[data-count]').forEach(el => {
      const target = parseInt(el.dataset.count, 10);
      if (isNaN(target)) return;
      let current = 0;
      const step = Math.max(1, Math.ceil(target / 50));
      const timer = setInterval(() => {
        current += step;
        if (current >= target) { current = target; clearInterval(timer); }
        el.textContent = current;
      }, 30);
    });
    document.getElementById('productModal')?.addEventListener('click', e => {
      if (e.target.id === 'productModal') closeProduct();
    });
    // Hash routing
    if (location.hash) navigate(location.hash.replace('#', ''));
    else navigate('inicio');
  });

  function toggleTheme() {
    document.body.classList.toggle('dark');
    localStorage.setItem('dpedro_theme', document.body.classList.contains('dark') ? 'dark' : 'light');
  }

  // ============ GLOBAL ============
  window.navigate = navigate;
  window.setCategory = setCategory;
  window.toggleOfertas = toggleOfertas;
  window.filterProducts = filterProducts;
  window.openDetail = openDetail;
  window.closeProduct = closeProduct;
  window.changeDetailQty = changeDetailQty;
  window.addDetailToCart = addDetailToCart;
  window.buyDetailNow = buyDetailNow;
  window.toggleTheme = toggleTheme;
})();