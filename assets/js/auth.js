/* D.PEDRO SOLUÇÕES — autenticação Supabase
 * Login passwordless por OTP de email (6 dígitos).
 * Permissões de empresa são lidas de ks_company_memberships e reforçadas no servidor/RLS.
 */
(function () {
  'use strict';
  const cfg = window.DPEDRO_SUPABASE_CONFIG;
  if (!cfg || !cfg.url || !cfg.publishableKey || !window.supabase?.createClient) {
    console.error('[DPAuth] Configuração ou SDK Supabase indisponível.');
    window.DPAuth = { ready: Promise.reject(new Error('Configuração Supabase indisponível')) };
    return;
  }

  const client = window.supabase.createClient(cfg.url, cfg.publishableKey, {
    auth: { autoRefreshToken: true, persistSession: true, detectSessionInUrl: true, flowType: 'pkce' }
  });

  const redirect = (path) => new URL(path, window.location.href).toString();
  const ADMIN_EMAIL = 'dpedroservice@gmail.com';
  const normalizeEmail = (email) => String(email || '').trim().toLowerCase();
  const requireAdminEmail = (email) => {
    if (normalizeEmail(email) !== ADMIN_EMAIL) {
      throw new Error('Esta plataforma administrativa é exclusiva do e-mail autorizado da D.PEDRO SOLUÇÕES.');
    }
  };
  const validEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const cleanError = (error) => {
    const message = error?.message || 'Não foi possível concluir a operação.';
    if (/invalid login credentials|user not found/i.test(message)) return 'Credenciais inválidas ou conta inexistente.';
    if (/rate limit|too many requests/i.test(message)) return 'Muitas tentativas. Aguarde alguns minutos e tente novamente.';
    if (/token has expired|otp expired/i.test(message)) return 'O código expirou. Solicite um novo código.';
    return message;
  };

  async function sendLoginCode(email) {
    email = normalizeEmail(email);
    if (!validEmail(email)) throw new Error('Introduza um endereço de e-mail válido.');
    requireAdminEmail(email);
    const { error } = await client.auth.signInWithOtp({ email, options: { shouldCreateUser: false } });
    if (error) throw new Error(cleanError(error));
    return { email, message: 'Código enviado. Consulte a caixa de entrada e o spam.' };
  }

  async function verifyLoginCode(email, token) {
    email = normalizeEmail(email);
    token = String(token || '').replace(/\D/g, '');
    if (!validEmail(email)) throw new Error('E-mail inválido.');
    requireAdminEmail(email);
    if (!/^\d{6}$/.test(token)) throw new Error('O código deve conter exatamente seis dígitos.');
    const { data, error } = await client.auth.verifyOtp({ email, token, type: 'email' });
    if (error) throw new Error(cleanError(error));
    if (!data.session || !data.user?.email_confirmed_at) {
      await client.auth.signOut();
      throw new Error('Não foi possível confirmar o e-mail. Solicite um novo código.');
    }
    return data;
  }

  async function register({ name, email, password }) {
    name = String(name || '').trim();
    email = normalizeEmail(email);
    if (name.length < 2) throw new Error('Introduza o nome completo.');
    if (!validEmail(email)) throw new Error('Introduza um endereço de e-mail válido.');
    requireAdminEmail(email);
    if (String(password || '').length < 10) throw new Error('A palavra-passe deve ter pelo menos 10 caracteres.');
    const { data, error } = await client.auth.signUp({
      email, password,
      options: { data: { full_name: name }, emailRedirectTo: redirect('login.html') }
    });
    if (error) throw new Error(cleanError(error));
    return { email, session: data.session, message: 'Conta criada. Enviámos um código de confirmação para o seu e-mail.' };
  }

  async function verifyRegistrationCode(email, token) {
    email = normalizeEmail(email);
    token = String(token || '').replace(/\D/g, '');
    if (!validEmail(email) || !/^\d{6}$/.test(token)) throw new Error('E-mail ou código inválido.');
    requireAdminEmail(email);
    const { data, error } = await client.auth.verifyOtp({ email, token, type: 'signup' });
    if (error) throw new Error(cleanError(error));
    if (!data.session) throw new Error('Confirmação recebida, mas não foi criada uma sessão. Tente entrar.');
    return data;
  }

  async function resendRegistrationCode(email) {
    email = normalizeEmail(email);
    if (!validEmail(email)) throw new Error('E-mail inválido.');
    requireAdminEmail(email);
    const { error } = await client.auth.resend({ type: 'signup', email });
    if (error) throw new Error(cleanError(error));
    return true;
  }

  async function requestPasswordReset(email) {
    email = normalizeEmail(email);
    if (!validEmail(email)) throw new Error('Introduza um endereço de e-mail válido.');
    requireAdminEmail(email);
    const { error } = await client.auth.resetPasswordForEmail(email, { redirectTo: redirect('reset-password.html') });
    if (error) throw new Error(cleanError(error));
    return true;
  }

  async function setNewPassword(password) {
    if (String(password || '').length < 10) throw new Error('A palavra-passe deve ter pelo menos 10 caracteres.');
    const { data: { user } } = await client.auth.getUser();
    if (!user) throw new Error('A sessão de recuperação expirou. Solicite novamente a recuperação.');
    const { error } = await client.auth.updateUser({ password });
    if (error) throw new Error(cleanError(error));
    return true;
  }

  async function getSession() {
    const { data, error } = await client.auth.getSession();
    if (error) throw new Error(cleanError(error));
    return data.session;
  }

  async function getUser() {
    const { data, error } = await client.auth.getUser();
    if (error) throw new Error(cleanError(error));
    return data.user;
  }

  async function getActiveMembership(companyId) {
    const user = await getUser();
    let query = client.from('ks_company_memberships')
      .select('company_id,user_id,role,status,permissions')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .limit(1);
    if (companyId) query = query.eq('company_id', companyId);
    const { data, error } = await query.maybeSingle();
    if (error) throw new Error(cleanError(error));
    return data || null;
  }

  function hasPermission(membership, moduleName, action) {
    if (!membership || membership.status !== 'active') return false;
    if (['owner', 'admin'].includes(membership.role)) return true;
    const actions = membership.permissions?.[moduleName];
    return Array.isArray(actions) && actions.includes(action);
  }

  async function requirePermission(moduleName, action) {
    const user = await getUser().catch(() => null);
    if (!user) {
      window.location.replace('login.html?next=' + encodeURIComponent(window.location.pathname.split('/').pop() || 'index.html'));
      return false;
    }
    if (normalizeEmail(user.email) !== ADMIN_EMAIL) {
      document.body.innerHTML = '<main style="max-width:620px;margin:10vh auto;padding:28px;font:16px system-ui;text-align:center"><h1>Acesso não autorizado</h1><p>Esta plataforma administrativa é exclusiva do e-mail autorizado da D.PEDRO SOLUÇÕES.</p></main>';
      return false;
    }
    const membership = await getActiveMembership().catch(() => null);
    if (!hasPermission(membership, moduleName, action)) {
      document.body.innerHTML = '<main style="max-width:620px;margin:10vh auto;padding:28px;font:16px system-ui;text-align:center"><h1>Acesso não autorizado</h1><p>O seu perfil não tem permissão para esta operação.</p><button onclick="DPAuth.signOut().then(()=>location.href=\'login.html\')">Terminar sessão</button></main>';
      return false;
    }
    return true;
  }

  function isAdmin(user) {
    if (normalizeEmail(user?.email) !== ADMIN_EMAIL) return false;
    const app = user?.app_metadata || {};
    return app.role === 'admin' || (Array.isArray(app.roles) && app.roles.includes('admin'));
  }

  async function requireAdmin() {
    const user = await getUser().catch(() => null);
    if (!user) {
      window.location.replace('login.html?next=' + encodeURIComponent('admin.html'));
      return false;
    }
    if (normalizeEmail(user.email) !== ADMIN_EMAIL) {
      await signOut().catch(() => {});
      document.body.innerHTML = '<main style="max-width:620px;margin:10vh auto;padding:28px;font:16px system-ui;text-align:center"><h1>Acesso não autorizado</h1><p>Esta plataforma administrativa é exclusiva do e-mail autorizado da D.PEDRO SOLUÇÕES.</p></main>';
      return false;
    }
    if (isAdmin(user)) return true;
    const membership = await getActiveMembership().catch(() => null);
    if (membership && ['owner', 'admin'].includes(membership.role)) return true;
    document.body.innerHTML = '<main style="max-width:620px;margin:10vh auto;padding:28px;font:16px system-ui;text-align:center"><h1>Acesso não autorizado</h1><p>A sua conta não tem permissões de proprietário ou administrador nesta empresa.</p><button onclick="DPAuth.signOut().then(()=>location.href=\'login.html\')">Terminar sessão</button></main>';
    return false;
  }

  async function signOut() {
    const { error } = await client.auth.signOut({ scope: 'local' });
    if (error) throw new Error(cleanError(error));
    return true;
  }

  window.DPAuth = Object.freeze({
    client, ready: Promise.resolve(true), sendLoginCode, verifyLoginCode,
    register, verifyRegistrationCode, resendRegistrationCode,
    requestPasswordReset, setNewPassword, getSession, getUser,
    getActiveMembership, hasPermission, requirePermission,
    isAdmin, requireAdmin, signOut
  });
})();
