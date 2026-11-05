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
 ['Comunidade','comunidade.html','users',[['Cursos','cursos.html'],['Webinars','webinars.html'],['Notificações','notificacoes.html'],['Atualizações','comunidade.html#atualizacoes'],['Central de ajuda','central-ajuda.html'],['Suporte técnico','suporte-tecnico.html']]],
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
})();