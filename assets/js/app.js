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
          <img src="${p.image}" alt="${escapeHtml(p.name)}" loading="lazy" onerror="this.style.display='none'">
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
          <button class="btn btn-secondary" style="margin:.7rem 0" onclick="searchProductImage('${escapeHtml(p.externalId || p.id)}','${escapeHtml(p.name)}')"><i class="fas fa-images"></i> Procurar imagem do produto</button>
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

  async function searchProductImage(productId, productName) {
    let panel=document.getElementById('dpImageFinder');
    if(!panel){panel=document.createElement('div');panel.id='dpImageFinder';panel.className='dp-image-finder';document.body.appendChild(panel);}
    panel.innerHTML='';
    const head=document.createElement('div');head.className='dp-image-head';
    const title=document.createElement('strong');title.textContent='Imagens para: '+productName;
    const close=document.createElement('button');close.textContent='×';close.onclick=()=>panel.remove();
    head.append(title,close);panel.append(head);
    const info=document.createElement('p');info.textContent='A procurar no Wikimedia Commons. Confirme se a imagem corresponde à marca e ao modelo.';panel.append(info);
    const resultsBox=document.createElement('div');resultsBox.className='dp-image-results';resultsBox.textContent='A pesquisar…';panel.append(resultsBox);
    try {
      const url='https://commons.wikimedia.org/w/api.php?action=query&generator=search&gsrsearch='+encodeURIComponent(productName)+'&gsrnamespace=6&gsrlimit=12&prop=imageinfo&iiprop=url|extmetadata&iiurlwidth=360&format=json&origin=*';
      const response=await fetch(url);if(!response.ok)throw new Error('Serviço de imagens indisponível.');
      const data=await response.json();const pages=Object.values(data.query?.pages||{});
      const results=pages.map(page=>{const image=page.imageinfo?.[0]||{};const meta=image.extmetadata||{};return {title:page.title,url:image.thumburl||image.url,original:image.url,license:meta.LicenseShortName?.value||'Licença não identificada',artist:meta.Artist?.value||'Autor não indicado'};}).filter(item=>item.url&&item.original);
      resultsBox.innerHTML='';if(!results.length){resultsBox.textContent='Sem resultados. Experimente marca + modelo.';return;}
      results.forEach((item,index)=>{const card=document.createElement('article');card.className='dp-image-option';const image=document.createElement('img');image.src=item.url;image.alt=item.title;const caption=document.createElement('small');caption.textContent=item.license+' · '+item.artist.replace(/<[^>]*>/g,' ');const choose=document.createElement('button');choose.textContent='Usar imagem';choose.onclick=()=>chooseProductImage(productId,item);const original=document.createElement('a');original.href=item.original;original.target='_blank';original.rel='noopener';original.textContent='Ver original';card.append(image,caption,choose,original);resultsBox.append(card);});
    } catch(error){resultsBox.textContent=error.message;}
  }
  function chooseProductImage(productId,item){
    window.DPEDRO_DB.saveProductImage(productId,item.url);
    if(currentDetailProduct){currentDetailProduct.image=item.url;const image=document.querySelector('#productDetail img');if(image)image.src=item.url;}
    const panel=document.getElementById('dpImageFinder');if(!panel)return;
    const note=document.createElement('p');note.className='dp-image-confirm';note.textContent='Imagem escolhida e guardada neste navegador. A sincronização para todos os visitantes exige armazenamento partilhado.';
    const link=document.createElement('a');link.href=item.original;link.target='_blank';link.rel='noopener';link.download='';link.textContent='Descarregar imagem original';
    const copy=document.createElement('button');copy.textContent='Copiar ligação';copy.onclick=()=>navigator.clipboard.writeText(item.original).then(()=>copy.textContent='Ligação copiada').catch(()=>copy.textContent='Use o menu do navegador para copiar');
    panel.append(note,link,copy);
  }
  // ============ INIT ============
  document.addEventListener('DOMContentLoaded', async () => {
    try { products = await window.DPEDRO_DB.loadProducts(); } catch (error) { products = []; const grid = document.getElementById('productsGrid'); if (grid) grid.innerHTML = '<div class="catalog-status"><h3>Catálogo temporariamente indisponível</h3><p>' + escapeHtml(error.message) + '</p><button class="btn btn-primary" onclick="location.reload()">Tentar novamente</button></div>'; }
    if (localStorage.getItem('dpedro_theme') === 'dark') document.body.classList.add('dark');
    renderFeatured();
    renderCategories();
    filterProducts();
    const liveCount=document.getElementById('liveProductCount');
    if(liveCount) liveCount.textContent=products.length.toLocaleString('pt-AO');
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
  window.searchProductImage = searchProductImage;
})();