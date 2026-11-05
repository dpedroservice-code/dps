(function(){
'use strict';
const header=document.querySelector('[data-site-header]');
const footer=document.querySelector('[data-site-footer]');
const navItems=[
 ['Início','index.html','home'],
 ['Empresa',null,'building',[['Quem somos','quem-somos.html'],['Mercados verticais','mercados-verticais.html'],['Sobre e ajuda','ajuda.html'],['Recrutamento','recrutamento.html'],['Indique e ganhe','indicar.html'],['Recursos','recursos-indisponiveis.html'],['Atualizações','atualizacoes.html'],['Manutenção','manutencao.html']]],
 ['Soluções','solucoes.html','shield',[['Câmaras CFTV','cctv.html'],['Alarmes','alarmes.html'],['Controlo de acesso','controlo-acesso.html'],['Energia solar','energia-solar.html'],['Cerca elétrica','cerca-eletrica.html'],['Gravadores','gravadores.html'],['Hardware e redes','hardware-redes.html']]],
 ['Produtos','produtos.html','box',[['Catálogo geral','catalogo.html'],['Loja virtual','loja-virtual.html'],['Aplicativos','aplicativos.html'],['Manuais','manuais.html'],['Templates','templates.html'],['Cardápios digitais','cardapios-digitais.html']]],
 ['Tecnologia','tecnologia.html','microchip',[['Assistente IA','assistente-ia.html'],['API e ERP','api-erp.html'],['Análise e relatórios','analise-relatorios.html'],['SEO','seo.html'],['Domínio e alojamento','dominio-alojamento.html'],['Comunicação digital','comunicacao-digital.html']]],
 ['Comunidade','comunidade.html','users',[['Cursos','cursos.html'],['Webinars','webinars.html'],['Notificações','notificacoes.html'],['Atualizações','atualizacoes.html'],['Central de ajuda','central-ajuda.html'],['Suporte técnico','suporte-tecnico.html']]],
 ['Contactos','contactos.html','envelope'],
 ['Admin','admin.html','lock'],
 ['KanawaSoft ERP','index.html#erp','desktop']
];
function item([label,url,icon,children]){
 if(!children)return '<li><a href="'+url+'">'+label+'</a></li>';
 const links=(url?[[label+' — visão geral',url],...children]:children).map(c=>'<a href="'+c[1]+'">'+c[0]+'</a>').join('');
 return '<li><details><summary>'+label+' ▾</summary><div class="site-submenu">'+links+'</div></details></li>';
}
if(header){
 header.className='site-header';
 header.innerHTML='<div class="site-topbar"><div><a href="tel:+244946299834">+244 946 299 834</a><a href="mailto:dpedroservice@gmail.com">dpedroservice@gmail.com</a><span>Luanda, Angola</span></div><div><a href="https://wa.me/244946299834" target="_blank" rel="noopener">WhatsApp</a></div></div><nav class="site-nav" aria-label="Navegação principal"><a class="site-brand" href="index.html"><img src="assets/1.png" alt=""><span>D.PEDRO SOLUÇÕES<small>TECNOLOGIA · SEGURANÇA · ENERGIA</small></span></a><button class="site-nav-toggle" type="button" aria-controls="site-menu" aria-expanded="false" aria-label="Abrir menu">☰</button><ul class="site-menu" id="site-menu">'+navItems.map(item).join('')+'</ul></nav>';
 const toggle=header.querySelector('.site-nav-toggle'),menu=header.querySelector('.site-menu');
 toggle.addEventListener('click',()=>{const open=menu.classList.toggle('is-open');toggle.setAttribute('aria-expanded',String(open));toggle.setAttribute('aria-label',open?'Fechar menu':'Abrir menu');toggle.textContent=open?'×':'☰';});
 header.querySelectorAll('a[href]').forEach(a=>{if(new URL(a.href,location.href).pathname===location.pathname && new URL(a.href,location.href).hash==='')a.setAttribute('aria-current','page');});
}
if(footer){
 footer.className='site-footer';
 footer.innerHTML='<div class="site-footer-grid"><div><strong>D.PEDRO SOLUÇÕES LDA</strong><p>Comércio e prestação de serviços em tecnologia, segurança eletrónica, informática, redes e energia.</p><p>Luanda, Angola</p></div><div><strong>Navegação</strong><a href="empresa.html">Empresa</a><a href="solucoes.html">Soluções</a><a href="produtos.html">Produtos</a><a href="tecnologia.html">Tecnologia</a><a href="comunidade.html">Comunidade</a></div><div><strong>Contactos</strong><a href="tel:+244946299834">+244 946 299 834</a><a href="mailto:dpedroservice@gmail.com">dpedroservice@gmail.com</a><a href="https://wa.me/244946299834" target="_blank" rel="noopener">WhatsApp</a></div></div><div class="site-footer-bottom">© '+new Date().getFullYear()+' D.PEDRO SOLUÇÕES LDA. Informações comerciais e disponibilidade confirmadas mediante consulta.</div>';
}

/* Centro de conteúdos integrado na página inicial e nas páginas internas. */
const contentGroups=[
{id:'empresa',title:'Empresa e confiança',intro:'Conheça a identidade, a forma de trabalho e as informações institucionais.',items:[
['Quem somos','quem-somos.html','Missão, visão, valores e áreas de atuação.'],['Mercados verticais','mercados-verticais.html','Soluções para residências, comércio, escritórios e organizações.'],['Sobre e ajuda','ajuda.html','Orientações para pedir informações e contratar serviços.'],['Recrutamento','recrutamento.html','Informações para candidaturas e oportunidades.'],['Indique e ganhe','indicar.html','Como recomendar os nossos serviços e consultar condições.'],['Atualizações','atualizacoes.html','Novidades e alterações comunicadas pela empresa.'],['Manutenção','manutencao.html','Cuidados preventivos e pedidos de manutenção.']]},
{id:'solucoes',title:'Segurança, energia e infraestrutura',intro:'Explore soluções técnicas e conheça os processos de avaliação, instalação e assistência.',items:[
['Câmaras CCTV','cctv.html','Videovigilância IP e analógica, gravação e acesso autorizado.'],['Alarmes','alarmes.html','Deteção de intrusão e planeamento de alertas.'],['Controlo de acesso','controlo-acesso.html','Gestão de entradas, utilizadores e pontos de passagem.'],['Energia solar','energia-solar.html','Avaliação de consumo e dimensionamento de sistemas solares.'],['Cerca elétrica','cerca-eletrica.html','Proteção perimetral, sinalização e manutenção.'],['Gravadores','gravadores.html','NVR, DVR, armazenamento e configuração.'],['Hardware e redes','hardware-redes.html','Computadores, conectividade, cablagem e redes locais.']]},
{id:'produtos',title:'Produtos e recursos digitais',intro:'Consulte categorias, ferramentas e materiais. Preços, stock e disponibilidade são confirmados antes da encomenda.',items:[
['Catálogo geral','catalogo.html','Visão geral de categorias e equipamentos.'],['Loja virtual','loja-virtual.html','Consulta de produtos e pedido de disponibilidade.'],['Aplicativos','aplicativos.html','Soluções e aplicações digitais disponíveis sob consulta.'],['Manuais','manuais.html','Guias de utilização e apoio técnico.'],['Templates','templates.html','Modelos digitais para diferentes necessidades.'],['Cardápios digitais','cardapios-digitais.html','Apresentação digital de menus e produtos.']]},
{id:'tecnologia',title:'Tecnologia e transformação digital',intro:'Conheça recursos digitais, integração de sistemas, análise de dados e presença online.',items:[
['Assistente IA','assistente-ia.html','Apoio informativo com revisão humana.'],['API e ERP','api-erp.html','Integração de sistemas com autenticação e segurança.'],['Análise e relatórios','analise-relatorios.html','Organização de dados e indicadores para decisão.'],['SEO','seo.html','Estrutura técnica e conteúdos para melhorar a descoberta online.'],['Domínio e alojamento','dominio-alojamento.html','Presença web, domínio, alojamento e manutenção.'],['Comunicação digital','comunicacao-digital.html','Canais digitais, conteúdos e comunicação com clientes.']]},
{id:'comunidade',title:'Comunidade, formação e apoio',intro:'Acompanhe conteúdos de aprendizagem, avisos, atualizações e canais de assistência.',items:[
['Cursos','cursos.html','Formação prática mediante calendário e vagas confirmados.'],['Webinars','webinars.html','Sessões online anunciadas conforme programação.'],['Notificações','notificacoes.html','Avisos e informações relevantes da plataforma.'],['Central de ajuda','central-ajuda.html','Respostas a dúvidas frequentes e orientações.'],['Suporte técnico','suporte-tecnico.html','Como descrever um problema e solicitar assistência.']]}
];
const currentPath=location.pathname.split('/').pop()||'index.html';
const activeGroup=contentGroups.find(g=>g.items.some(i=>i[1]===currentPath));
function contentCard(i){return '<article class="content-hub-card"><h3><a href="'+i[1]+'">'+i[0]+'</a></h3><p>'+i[2]+'</p><a class="content-hub-link" href="'+i[1]+'">Explorar conteúdo <span aria-hidden="true">→</span></a></article>';}
function injectContentHub(){
 const host=document.querySelector('#page-inicio')||document.querySelector('main');
 if(!host||document.querySelector('[data-content-hub]'))return;
 const section=document.createElement('section');section.className='content-hub';section.dataset.contentHub='';
 if(!activeGroup||currentPath==='index.html'){
  section.innerHTML='<div class="content-hub-heading"><span class="badge">Centro de conteúdos</span><h2>Explore tudo o que a D.PEDRO SOLUÇÕES oferece</h2><p>Encontre informação sobre a empresa, soluções técnicas, produtos, tecnologia e apoio. Cada cartão abre uma página com detalhes e próximos passos.</p></div>'+contentGroups.map(g=>'<section class="content-hub-group"><div class="content-hub-group-heading"><h3>'+g.title+'</h3><p>'+g.intro+'</p></div><div class="content-hub-grid">'+g.items.map(contentCard).join('')+'</div></section>').join('');
 }else{
  section.innerHTML='<div class="content-hub-heading"><span class="badge">Mais nesta área</span><h2>'+activeGroup.title+'</h2><p>'+activeGroup.intro+'</p></div><div class="content-hub-grid">'+activeGroup.items.filter(i=>i[1]!==currentPath).map(contentCard).join('')+'</div><p class="content-hub-home"><a href="index.html">← Voltar à página inicial e consultar todas as áreas</a></p>';
 }
 host.appendChild(section);
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',injectContentHub,{once:true});else injectContentHub();

})();