/* =========================================================
   D.PEDRO SOLUÇÕES — BASE DE DADOS (100 PRODUTOS)
   Imagens: assets/1.png → assets/100.png
   Estados: publicado | rascunho | partilhado
   ========================================================= */
'use strict';

(function () {
  const STORAGE_PRODUCTS = 'dpedro_products_v3';

  const categories = [
    { id: 'all',         name: 'Todos',                    icon: 'fa-th' },
    { id: 'informatica', name: 'Informática & Redes',      icon: 'fa-laptop' },
    { id: 'grafica',     name: 'Gráfica & Design',         icon: 'fa-print' },
    { id: 'energia',     name: 'Energia Solar & Elétrico', icon: 'fa-solar-panel' },
    { id: 'papelaria',   name: 'Papelaria & Escritório',   icon: 'fa-pen' },
    { id: 'telecom',     name: 'Telecomunicações',         icon: 'fa-satellite-dish' },
    { id: 'rastreio',    name: 'Rastreamento & Proteção',  icon: 'fa-map-marker-alt' },
    { id: 'servicos',    name: 'Serviços Empresariais',    icon: 'fa-briefcase' }
  ];

  /* Gerador de 100 produtos — distribui pelas 7 categorias */
  const seedProducts = (() => {
    const base = [
      // 1-15 Informática
      { cat:'informatica', name:'Desktop Core i5', brand:'HP',         price:450000, promo:420000, stock:5,   specs:'i5 · 8GB · 500GB SSD',    desc:'Desktop profissional para escritório.' },
      { cat:'informatica', name:'Notebook Core i7', brand:'Dell',      price:750000, promo:null,   stock:3,   specs:'i7 · 16GB · 512GB SSD',   desc:'Notebook de alto desempenho.' },
      { cat:'informatica', name:'Monitor LED 24"',  brand:'Samsung',   price:95000,  promo:85000,  stock:10,  specs:'24" Full HD HDMI',        desc:'Monitor LED Full HD.' },
      { cat:'informatica', name:'Teclado + Rato',   brand:'Logitech',  price:18000,  promo:15000,  stock:20,  specs:'USB ABNT2 1200DPI',       desc:'Kit teclado e rato USB.' },
      { cat:'informatica', name:'Impressora Multi', brand:'HP',        price:180000, promo:null,   stock:6,   specs:'Print·Copy·Scan·WiFi',    desc:'Multifunções Wi-Fi.' },
      { cat:'informatica', name:'Scanner A4',       brand:'Canon',     price:120000, promo:null,   stock:4,   specs:'A4 · 2400 DPI',           desc:'Scanner alta resolução.' },
      { cat:'informatica', name:'Servidor NAS 4TB', brand:'Synology',  price:850000, promo:null,   stock:2,   specs:'4TB · RAID',              desc:'NAS para armazenamento em rede.' },
      { cat:'informatica', name:'Router Gigabit',   brand:'TP-Link',   price:65000,  promo:55000,  stock:8,   specs:'Dual Band · 4 antenas',   desc:'Router Wi-Fi gigabit.' },
      { cat:'informatica', name:'Switch 16 Portas', brand:'TP-Link',   price:85000,  promo:null,   stock:5,   specs:'16P · Gigabit · Rack',    desc:'Switch para empresas.' },
      { cat:'informatica', name:'Access Point',     brand:'Ubiquiti',  price:75000,  promo:null,   stock:12,  specs:'PoE · Dual Band',         desc:'AP profissional.' },
      { cat:'informatica', name:'Cabo Cat6 305m',   brand:'D.PEDRO',   price:45000,  promo:null,   stock:15,  specs:'Cat6 · UTP',              desc:'Rolo cabo rede Cat6.' },
      { cat:'informatica', name:'UPS 1500VA',       brand:'APC',       price:120000, promo:105000, stock:7,   specs:'1500VA · 900W',           desc:'UPS com proteção.' },
      { cat:'informatica', name:'Windows 11 Pro',   brand:'Microsoft', price:95000,  promo:null,   stock:20,  specs:'Licença original',        desc:'Licença original Windows 11 Pro.' },
      { cat:'informatica', name:'Instalação Rede',  brand:'D.PEDRO',   price:15000,  promo:null,   stock:999, specs:'Por ponto',               desc:'Instalação rede estruturada.' },
      { cat:'informatica', name:'Manutenção PC',    brand:'D.PEDRO',   price:20000,  promo:null,   stock:999, specs:'Visita técnica',          desc:'Assistência técnica PC.' },
      // 16-27 Gráfica
      { cat:'grafica', name:'Logotipo + Identidade', brand:'D.PEDRO',  price:85000,  promo:null,   stock:999, specs:'Logo + papelaria',        desc:'Identidade visual completa.' },
      { cat:'grafica', name:'Cartões 500un',         brand:'D.PEDRO',  price:25000,  promo:20000,  stock:50,  specs:'500 · 300g',              desc:'Cartões de visita.' },
      { cat:'grafica', name:'Flyers A5 1000un',      brand:'D.PEDRO',  price:35000,  promo:null,   stock:30,  specs:'1000 · A5',               desc:'Flyers A5 couché.' },
      { cat:'grafica', name:'Papel Timbrado',        brand:'D.PEDRO',  price:30000,  promo:null,   stock:40,  specs:'500 · A4 90g',            desc:'Papel timbrado.' },
      { cat:'grafica', name:'Banner 2x1m',           brand:'D.PEDRO',  price:45000,  promo:null,   stock:20,  specs:'2x1 · Lona 440g',         desc:'Banner publicitário.' },
      { cat:'grafica', name:'Outdoor 3x2m',          brand:'D.PEDRO',  price:180000, promo:null,   stock:5,   specs:'3x2 · Estrutura',         desc:'Outdoor com estrutura.' },
      { cat:'grafica', name:'Impressão Digital',     brand:'D.PEDRO',  price:5000,   promo:null,   stock:999, specs:'A4 · cores',              desc:'Impressão por página.' },
      { cat:'grafica', name:'Camiseta Personalizada',brand:'D.PEDRO',  price:12000,  promo:null,   stock:100, specs:'Algodão · Estampa',       desc:'Camiseta personalizada.' },
      { cat:'grafica', name:'Catálogo Comercial',    brand:'D.PEDRO',  price:55000,  promo:null,   stock:15,  specs:'A4 · 16 pág',             desc:'Catálogo comercial.' },
      { cat:'grafica', name:'Design Redes Sociais',  brand:'D.PEDRO',  price:35000,  promo:null,   stock:999, specs:'10 posts',                desc:'Pacote 10 posts.' },
      { cat:'grafica', name:'Edição Foto/Vídeo',     brand:'D.PEDRO',  price:25000,  promo:null,   stock:999, specs:'Por projeto',             desc:'Edição profissional.' },
      { cat:'grafica', name:'Filmagem Eventos',      brand:'D.PEDRO',  price:150000, promo:null,   stock:999, specs:'4h foto+vídeo',           desc:'Cobertura de eventos.' },
      // 28-41 Energia
      { cat:'energia', name:'Painel Solar 550W',    brand:'JA Solar',  price:95000,  promo:null,   stock:8,   specs:'550W · Monocristalino',   desc:'Painel alta eficiência.' },
      { cat:'energia', name:'Painel Solar 450W',    brand:'Trina',     price:78000,  promo:72000,  stock:12,  specs:'450W · Monocristalino',   desc:'Painel solar 450W.' },
      { cat:'energia', name:'Inversor Solar 3kW',   brand:'Growatt',   price:220000, promo:199000, stock:3,   specs:'3kW · MPPT',              desc:'Inversor solar off grid.' },
      { cat:'energia', name:'Inversor Solar 5kW',   brand:'Growatt',   price:380000, promo:null,   stock:2,   specs:'5kW · Híbrido',           desc:'Inversor híbrido 5kW.' },
      { cat:'energia', name:'Bateria Lítio 5kWh',   brand:'Pylontech', price:480000, promo:null,   stock:2,   specs:'5kWh · LiFePO4',          desc:'Bateria para solar.' },
      { cat:'energia', name:'Controlador MPPT',     brand:'EPEver',    price:65000,  promo:null,   stock:10,  specs:'60A · MPPT',              desc:'Controlador solar 60A.' },
      { cat:'energia', name:'Estrutura Fixação',    brand:'D.PEDRO',   price:45000,  promo:null,   stock:15,  specs:'Alumínio',                desc:'Estrutura alumínio.' },
      { cat:'energia', name:'Cabo Solar + MC4',     brand:'D.PEDRO',   price:18000,  promo:null,   stock:30,  specs:'6mm² · MC4',              desc:'Cabo solar 6mm².' },
      { cat:'energia', name:'Disjuntor DC',         brand:'Schneider', price:12000,  promo:null,   stock:40,  specs:'32A · 2P',                desc:'Disjuntor DC.' },
      { cat:'energia', name:'Quadro Elétrico',      brand:'Schneider', price:35000,  promo:null,   stock:8,   specs:'12 mód · IP65',           desc:'Quadro elétrico.' },
      { cat:'energia', name:'Lâmpada LED 9W',       brand:'Philips',   price:3500,   promo:3000,   stock:100, specs:'9W · E27 · 6500K',        desc:'Lâmpada LED.' },
      { cat:'energia', name:'Kit Solar 1kW',        brand:'D.PEDRO',   price:850000, promo:null,   stock:3,   specs:'Painel+Inv+Bat',          desc:'Kit solar completo.' },
      { cat:'energia', name:'Instalação Solar',     brand:'D.PEDRO',   price:80000,  promo:null,   stock:999, specs:'Por kW',                  desc:'Instalação solar.' },
      { cat:'energia', name:'Manutenção Solar',     brand:'D.PEDRO',   price:25000,  promo:null,   stock:999, specs:'Limpeza+Verif.',          desc:'Manutenção solar.' },
      // 42-53 Papelaria
      { cat:'papelaria', name:'Papel A4 500fl',     brand:'Navigator', price:4500,   promo:4000,   stock:200, specs:'A4 · 80g',                desc:'Resma papel A4.' },
      { cat:'papelaria', name:'Caderno A4 100fl',   brand:'D.PEDRO',   price:2500,   promo:null,   stock:150, specs:'A4 · Capa dura',          desc:'Caderno A4.' },
      { cat:'papelaria', name:'Canetas cx12',       brand:'Bic',       price:3500,   promo:null,   stock:80,  specs:'12 · Azul',               desc:'Caixa 12 canetas.' },
      { cat:'papelaria', name:'Lápis + Borracha',   brand:'Faber',     price:1200,   promo:null,   stock:200, specs:'HB',                      desc:'Lápis HB + borracha.' },
      { cat:'papelaria', name:'Marcadores cx4',     brand:'Pilot',     price:3500,   promo:null,   stock:60,  specs:'4 cores',                 desc:'Marcadores coloridos.' },
      { cat:'papelaria', name:'Grampeador',         brand:'D.PEDRO',   price:4500,   promo:null,   stock:40,  specs:'25 fl · 1000g',           desc:'Grampeador mesa.' },
      { cat:'papelaria', name:'Pasta Arquivo',      brand:'D.PEDRO',   price:2500,   promo:null,   stock:80,  specs:'A4 lombada',              desc:'Pasta arquivo A4.' },
      { cat:'papelaria', name:'Toner HP',           brand:'HP',        price:45000,  promo:null,   stock:20,  specs:'Original preto',          desc:'Toner original HP.' },
      { cat:'papelaria', name:'Cartucho Canon',     brand:'Canon',     price:18000,  promo:null,   stock:25,  specs:'Colorido',                desc:'Cartucho tinta.' },
      { cat:'papelaria', name:'Calculadora',        brand:'Casio',     price:8500,   promo:null,   stock:30,  specs:'Científica',              desc:'Calculadora científica.' },
      { cat:'papelaria', name:'Organizador Mesa',   brand:'D.PEDRO',   price:3500,   promo:null,   stock:50,  specs:'Metal 3 comp.',           desc:'Organizador metal.' },
      { cat:'papelaria', name:'Kit Escolar',        brand:'D.PEDRO',   price:12000,  promo:null,   stock:40,  specs:'Kit completo',            desc:'Kit escolar básico.' },
      // 54-62 Telecom
      { cat:'telecom', name:'Parabólica 90cm',     brand:'D.PEDRO',   price:35000,  promo:null,   stock:10,  specs:'90cm + LNB',              desc:'Antena parabólica.' },
      { cat:'telecom', name:'Receptor TV',         brand:'D.PEDRO',   price:18000,  promo:null,   stock:20,  specs:'DVB-S2 FullHD',           desc:'Receptor digital.' },
      { cat:'telecom', name:'Router 4G/5G',        brand:'Huawei',    price:85000,  promo:75000,  stock:8,   specs:'4G/5G WiFi',              desc:'Router móvel.' },
      { cat:'telecom', name:'Antena Internet',     brand:'TP-Link',   price:45000,  promo:null,   stock:12,  specs:'18dBi',                   desc:'Antena direcional.' },
      { cat:'telecom', name:'Cabo HDMI 2m',        brand:'D.PEDRO',   price:4500,   promo:null,   stock:40,  specs:'4K · 2.1',                desc:'Cabo HDMI 4K.' },
      { cat:'telecom', name:'Cabo USB-C 1m',       brand:'D.PEDRO',   price:3500,   promo:null,   stock:60,  specs:'60W · 1m',                desc:'Cabo USB-C.' },
      { cat:'telecom', name:'Carregador 65W',      brand:'Anker',     price:12000,  promo:null,   stock:30,  specs:'65W · GaN',               desc:'Carregador rápido.' },
      { cat:'telecom', name:'Auscultadores BT',    brand:'JBL',       price:25000,  promo:22000,  stock:15,  specs:'BT 5.0 · 20h',            desc:'Auscultadores BT.' },
      { cat:'telecom', name:'Kit Acessórios Tel',  brand:'D.PEDRO',   price:8000,   promo:null,   stock:50,  specs:'Capa+película',           desc:'Kit acessórios telemóvel.' },
      // 63-69 Rastreio
      { cat:'rastreio', name:'Rastreador GPS',     brand:'Teltonika', price:85000,  promo:75000,  stock:6,   specs:'4G · corte motor',        desc:'Rastreador veicular.' },
      { cat:'rastreio', name:'Sistema Frota',      brand:'D.PEDRO',   price:150000, promo:null,   stock:3,   specs:'10 veíc · plataforma',    desc:'Sistema frota GPS.' },
      { cat:'rastreio', name:'Cofre 50cm',         brand:'D.PEDRO',   price:120000, promo:null,   stock:4,   specs:'Digital · fogo',          desc:'Cofre segurança.' },
      { cat:'rastreio', name:'EPI Kit',            brand:'D.PEDRO',   price:15000,  promo:null,   stock:30,  specs:'Cap+luvas+colete',        desc:'Equipamento proteção.' },
      { cat:'rastreio', name:'Kit Biossegurança',  brand:'D.PEDRO',   price:25000,  promo:null,   stock:20,  specs:'Máscara+álcool',          desc:'Kit biossegurança.' },
      { cat:'rastreio', name:'Segurança Instalação',brand:'D.PEDRO',  price:85000,  promo:null,   stock:999, specs:'CFTV+Alarme+Acesso',      desc:'Segurança completa.' },
      { cat:'rastreio', name:'Monitorização Veíc.',brand:'D.PEDRO',   price:35000,  promo:null,   stock:999, specs:'Mensal · veíc',           desc:'Monitorização veicular.' },
      // 70-79 Serviços
      { cat:'servicos', name:'Consultoria TI',     brand:'D.PEDRO',   price:75000,  promo:null,   stock:999, specs:'Por projeto',             desc:'Consultoria tecnologia.' },
      { cat:'servicos', name:'Instalação Segurança',brand:'D.PEDRO',  price:120000, promo:null,   stock:999, specs:'Por sistema',             desc:'Instalação segurança.' },
      { cat:'servicos', name:'Manutenção Preventiva',brand:'D.PEDRO', price:35000,  promo:null,   stock:999, specs:'Visita mensal',           desc:'Manutenção mensal.' },
      { cat:'servicos', name:'Manutenção Corretiva',brand:'D.PEDRO',  price:45000,  promo:null,   stock:999, specs:'Por intervenção',         desc:'Manutenção corretiva.' },
      { cat:'servicos', name:'Rede Estruturada',   brand:'D.PEDRO',   price:180000, promo:null,   stock:999, specs:'Projeto completo',        desc:'Instalação rede.' },
      { cat:'servicos', name:'Config Equipamentos',brand:'D.PEDRO',   price:25000,  promo:null,   stock:999, specs:'Por equip.',              desc:'Configuração equipamentos.' },
      { cat:'servicos', name:'Formação Informática',brand:'D.PEDRO',  price:60000,  promo:null,   stock:999, specs:'Curso 20h',               desc:'Formação informática.' },
      { cat:'servicos', name:'Formação Software',  brand:'D.PEDRO',   price:80000,  promo:null,   stock:999, specs:'Curso 30h',               desc:'Formação software.' },
      { cat:'servicos', name:'Assistência Técnica',brand:'D.PEDRO',   price:20000,  promo:null,   stock:999, specs:'Visita',                  desc:'Assistência técnica.' },
      { cat:'servicos', name:'Fornecimento Sob Medida',brand:'D.PEDRO',price:50000, promo:null,   stock:999, specs:'Sob consulta',            desc:'Fornecimento custom.' }
    ];

    // Gera 100: repete base com variações até chegar a 100
    const products = [];
    let id = 1;
    for (let i = 0; i < 100; i++) {
      const src = base[i % base.length];
      const cycle = Math.floor(i / base.length);
      const suffix = cycle > 0 ? ` v${cycle + 1}` : '';
      products.push({
        id,
        name: src.name + suffix,
        category: src.cat,
        brand: src.brand,
        price: src.price,
        promo: src.promo,
        stock: src.stock,
        warranty: '1 ano',
        image: `assets/${id}.png`,
        specs: src.specs,
        description: src.desc,
        status: 'publicado',          // publicado | rascunho | partilhado
        shared: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
      id++;
    }
    return products;
  })();

  function loadProducts() {
    try {
      const raw = localStorage.getItem(STORAGE_PRODUCTS);
      if (raw) {
        const p = JSON.parse(raw);
        if (Array.isArray(p) && p.length === 100) return p;
      }
    } catch (e) {}
    return JSON.parse(JSON.stringify(seedProducts));
  }
  function saveProducts(list) {
    localStorage.setItem(STORAGE_PRODUCTS, JSON.stringify(list));
  }
  function fmtKz(n) {
    return 'Kz ' + Number(n || 0).toLocaleString('pt-AO');
  }

  window.DPEDRO_DB = {
    categories,
    seedProducts,
    loadProducts,
    saveProducts,
    fmtKz
  };
})();