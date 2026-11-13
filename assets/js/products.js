/* D.PEDRO SOLUÇÕES — Catálogo real Kanawa Soft. Sem produtos de demonstração. */
'use strict';
(function(){
 const STORAGE_IMAGES='dpedro_product_image_overrides_v1';
 const categories=[{id:'all',name:'Todos',icon:'fa-th'},{id:'informatica',name:'Informática & Redes',icon:'fa-laptop'},{id:'grafica',name:'Gráfica & Design',icon:'fa-print'},{id:'energia',name:'Energia Solar & Elétrico',icon:'fa-solar-panel'},{id:'papelaria',name:'Papelaria & Escritório',icon:'fa-pen'},{id:'telecom',name:'Telecomunicações',icon:'fa-satellite-dish'},{id:'rastreio',name:'Rastreamento & Proteção',icon:'fa-map-marker-alt'},{id:'servicos',name:'Serviços Empresariais',icon:'fa-briefcase'}];
 function overrides(){try{return JSON.parse(localStorage.getItem(STORAGE_IMAGES)||'{}')}catch(e){return {}}}
 function normalize(row,index){const id=String(row.external_id||row.sku||row.id||'');const raw=typeof row.image_path==='string'?row.image_path.trim():'';const image=/^https:\/\//i.test(raw)?raw:'';return {id:index+1,externalId:id,name:row.name||'Produto',category:String(row.category||'').toLowerCase(),brand:row.brand||'',price:Number(row.unit_price||0),promo:null,stock:Number(row.stock_quantity||0),specs:row.sku||'',description:row.description||'',image,status:'publicado',unit:row.unit||'un',externalId:id,source:'kanawa'}}
 async function loadProducts(){const res=await fetch('/.netlify/functions/kanawa-catalog',{headers:{Accept:'application/json'},cache:'no-store'});if(!res.ok){let message='Não foi possível carregar o catálogo do Kanawa Soft.';try{const data=await res.json();message=data.error||message}catch(e){}throw new Error(message)}const payload=await res.json();if(!Array.isArray(payload.products))throw new Error('Resposta de catálogo inválida.');const images=overrides();return payload.products.map(normalize).map(p=>({...p,image:images[p.externalId]||p.image}))}
 function saveProductImage(id,url){const map=overrides();map[String(id)]=url;localStorage.setItem(STORAGE_IMAGES,JSON.stringify(map))}
 function fmtKz(n){return 'Kz '+Number(n||0).toLocaleString('pt-AO')}
 window.DPEDRO_DB={categories,loadProducts,saveProductImage,fmtKz};
})();