/* D.PEDRO SOLUÇÕES — Legacy admin lock.
   The former browser-only password was not server authentication.
   Keep the panel closed until a real server-side identity and permissions layer is configured. */
'use strict';
(function(){
  function doLogin(){
    const message='A área administrativa está temporariamente bloqueada durante a activação da autenticação segura no servidor. Não introduza a palavra-passe antiga.';
    const error=document.getElementById('loginError');
    if(error) error.textContent=message;
    else window.alert(message);
  }
  function logout(){window.location.href='index.html';}
  document.addEventListener('DOMContentLoaded',function(){
    const panel=document.getElementById('adminPanel');
    if(panel) panel.style.display='none';
    const login=document.getElementById('loginScreen');
    if(login) login.style.display='block';
    const description=document.querySelector('#loginScreen p');
    if(description) description.textContent='Painel temporariamente indisponível. A autenticação segura está em preparação.';
  });
  window.ADMIN={logout};
  window.doLogin=doLogin;
})();
