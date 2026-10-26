/* =========================================================
   D.PEDRO SOLUÇÕES — Base de Dados Central (fonte de verdade)
   Tudo o que o admin altera reflete-se imediatamente no site.
   ========================================================= */
(function () {
    'use strict';

    const KEYS = {
        products: 'dpedro_products',
        stats:    'dpedro_stats',
        orders:   'dpedro_orders',
        theme:    'dpedro_theme',
        admin:    'dpedro_admin'
    };

    /* ---------- CATEGORIAS ---------- */
    const CATEGORIES = [
        { id: 'all',         name: 'Todos',          icon: 'fa-th' },
        { id: 'cftv',        name: 'CFTV',           icon: 'fa-video' },
        { id: 'seguranca',   name: 'Segurança',      icon: 'fa-shield-alt' },
        { id: 'energia',     name: 'Energia Solar',  icon: 'fa-solar-panel' },
        { id: 'redes',       name: 'Redes',          icon: 'fa-network-wired' },
        { id: 'acesso',      name: 'Acesso',         icon: 'fa-fingerprint' },
        { id: 'informatica', name: 'Informática',    icon: 'fa-laptop' },
        { id: 'grafica',     name: 'Gráfica',        icon: 'fa-print' }
    ];

    /* ---------- PRODUTOS REAIS (sem demo) ---------- */
    const DEFAULT_PRODUCTS = [
        {
            id: 1,
            name: 'Câmara IP Hikvision 4MP',
            category: 'cftv', brand: 'Hikvision',
            price: 45000, promo: 38000, stock: 12,
            warranty: '2 anos',
            image: 'https://placehold.co/600x600/2563eb/white?text=C%C3%A2mara+IP',
            specs: '4MP · Visão noturna · PoE · IP67',
            description: 'Câmara dome IP de alta resolução com deteção de movimento e acesso remoto via APP.'
        },
        {
            id: 2,
            name: 'Kit CFTV 4 Câmaras',
            category: 'cftv', brand: 'Dahua',
            price: 180000, promo: 155000, stock: 5,
            warranty: '1 ano',
            image: 'https://placehold.co/600x600/2563eb/white?text=Kit+CFTV',
            specs: '4 câmaras 2MP + DVR + disco 1TB',
            description: 'Kit completo de videovigilância com 4 câmaras, DVR, disco e instalação.'
        },
        {
            id: 3,
            name: 'Painel Solar 550W',
            category: 'energia', brand: 'JA Solar',
            price: 95000, promo: null, stock: 8,
            warranty: '10 anos',
            image: 'https://placehold.co/600x600/2563eb/white?text=Painel+Solar',
            specs: '550W · Monocristalino · 25 anos',
            description: 'Painel solar de alta eficiência para sistemas residenciais e comerciais.'
        },
        {
            id: 4,
            name: 'Inversor Solar 3kW',
            category: 'energia', brand: 'Growatt',
            price: 220000, promo: 199000, stock: 3,
            warranty: '5 anos',
            image: 'https://placehold.co/600x600/2563eb/white?text=Inversor',
            specs: '3kW · MPPT · Off Grid',
            description: 'Inversor solar com controlador MPPT integrado para sistemas off grid.'
        },
        {
            id: 5,
            name: 'Switch 8 Portas Gigabit',
            category: 'redes', brand: 'TP-Link',
            price: 35000, promo: null, stock: 15,
            warranty: '3 anos',
            image: 'https://placehold.co/600x600/2563eb/white?text=Switch',
            specs: '8 portas · Gigabit · Unmanaged',
            description: 'Switch gigabit de 8 portas para redes domésticas e pequenas empresas.'
        },
        {
            id: 6,
            name: 'Terminal Biométrico',
            category: 'acesso', brand: 'ZKTeco',
            price: 95000, promo: null, stock: 4,
            warranty: '2 anos',
            image: 'https://placehold.co/600x600/2563eb/white?text=Biom%C3%A9trico',
            specs: 'Digital · RFID · 3000 utilizadores',
            description: 'Terminal de controlo de acesso biométrico com RFID.'
        },
        {
            id: 7,
            name: 'Kit Alarme 4 Sensores',
            category: 'seguranca', brand: 'Paradox',
            price: 75000, promo: 68000, stock: 7,
            warranty: '1 ano',
            image: 'https://placehold.co/600x600/2563eb/white?text=Alarme',
            specs: 'Central + 4 sensores + sirene',
            description: 'Kit de alarme com central, sensores de movimento e sirene.'
        },
        {
            id: 8,
            name: 'Notebook Core i5',
            category: 'informatica', brand: 'HP',
            price: 450000, promo: null, stock: 3,
            warranty: '1 ano',
            image: 'https://placehold.co/600x600/2563eb/white?text=Notebook',
            specs: 'i5 · 8GB RAM · 256GB SSD',
            description: 'Notebook para trabalho e estudo com processador Core i5.'
        },
        {
            id: 9,
            name: 'Cartões de Visita (500un)',
            category: 'grafica', brand: 'D.PEDRO',
            price: 25000, promo: 20000, stock: 50,
            warranty: 'N/A',
            image: 'https://placehold.co/600x600/2563eb/white?text=Cart%C3%B5es',
            specs: '500 unidades · 4/4 cores',
            description: 'Impressão de cartões de visita em papel couché 300g.'
        }
    ];

    /* ---------- ESTATÍSTICAS REAIS (editáveis no admin) ---------- */
    const DEFAULT_STATS = {
        anos:      { value: 5,  label: 'Anos',     icon: 'fa-calendar-alt', suffix: '' },
        clientes:  { value: 200, label: 'Clientes', icon: 'fa-users',        suffix: '+' },
        projetos:  { value: 500, label: 'Projetos', icon: 'fa-diagram-project', suffix: '+' },
        suporte:   { value: 24, label: 'Suporte',  icon: 'fa-headset',      suffix: '/7' }
    };

    /* ---------- HELPERS ---------- */
    function loadJSON(key, fallback) {
        try {
            const raw = localStorage.getItem(key);
            if (!raw) return JSON.parse(JSON.stringify(fallback));
            const parsed = JSON.parse(raw);
            if (parsed === null || parsed === undefined) return JSON.parse(JSON.stringify(fallback));
            return parsed;
        } catch (e) {
            return JSON.parse(JSON.stringify(fallback));
        }
    }
    function saveJSON(key, value) {
        try { localStorage.setItem(key, JSON.stringify(value)); return true; }
        catch (e) { console.warn('Falha ao guardar', key, e); return false; }
    }

    /* ---------- API PÚBLICA ---------- */
    window.DPEDRO_DB = {
        categories: CATEGORIES,

        /* PRODUTOS */
        loadProducts: function () { return loadJSON(KEYS.products, DEFAULT_PRODUCTS); },
        saveProducts: function (list) { return saveJSON(KEYS.products, list); },
        resetProducts: function () {
            localStorage.removeItem(KEYS.products);
            return JSON.parse(JSON.stringify(DEFAULT_PRODUCTS));
        },

        /* ESTATÍSTICAS */
        loadStats: function () { return loadJSON(KEYS.stats, DEFAULT_STATS); },
        saveStats: function (stats) {
            saveJSON(KEYS.stats, stats);
            /* Dispara evento para o index atualizar imediatamente */
            window.dispatchEvent(new CustomEvent('dpedro:stats-updated', { detail: stats }));
            return true;
        },
        resetStats: function () {
            localStorage.removeItem(KEYS.stats);
            window.dispatchEvent(new CustomEvent('dpedro:stats-updated', { detail: DEFAULT_STATS }));
            return JSON.parse(JSON.stringify(DEFAULT_STATS));
        },

        /* PEDIDOS */
        loadOrders: function () { return loadJSON(KEYS.orders, []); },
        saveOrders: function (orders) { return saveJSON(KEYS.orders, orders); },
        addOrder: function (order) {
            const all = this.loadOrders();
            all.unshift(order);
            this.saveOrders(all);
            return order;
        },

        /* RESET TOTAL */
        resetAll: function () {
            Object.values(KEYS).forEach(k => localStorage.removeItem(k));
            window.dispatchEvent(new CustomEvent('dpedro:stats-updated', { detail: DEFAULT_STATS }));
        },

        /* FORMATAÇÃO */
        fmtKz: function (n) { return 'Kz ' + Number(n).toLocaleString('pt-AO'); }
    };

    /* Alias global para compatibilidade com código antigo */
    window.fmtKz = window.DPEDRO_DB.fmtKz;
})();