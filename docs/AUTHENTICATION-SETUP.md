# Configuração de autenticação — D.PEDRO SOLUÇÕES

## Implementado no código
- Login sem palavra-passe por código OTP de seis dígitos no e-mail.
- Registo com palavra-passe e confirmação OTP.
- Reenvio de código de confirmação.
- Recuperação por ligação segura e atualização de palavra-passe.
- Sessão persistente/renovável pelo SDK oficial Supabase.
- Autorização administrativa baseada exclusivamente em `app_metadata.role=admin` ou `app_metadata.roles` contendo `admin`.
- Remoção da senha fixa do painel e da confiança no `localStorage` para autorizar administradores.

## Configuração obrigatória no Supabase Dashboard

Projeto: `APP` (`jiehrswweoyesbabrpjf`).

1. Authentication → URL Configuration:
   - Site URL: `https://dpedrosolucoes.shop` (ou o domínio efetivo publicado).
   - Redirect URLs: adicionar `https://dpedrosolucoes.shop/**`, `https://dpedrosolucoeslda.netlify.app/**` e os domínios de preview realmente utilizados.
   - Em produção, remover domínios de preview que já não sejam necessários.
2. Authentication → Providers → Email:
   - Ativar Email provider.
   - Ativar confirmação de e-mail.
   - Para o login OTP, editar o template **Magic Link** para enviar o token numérico, por exemplo:
     `<h2>Código de acesso D.PEDRO SOLUÇÕES</h2><p>O seu código de acesso é: <strong>{{ .Token }}</strong></p><p>Este código é pessoal. Não o partilhe.</p>`
   - Editar também o template **Confirm signup** para incluir `{{ .Token }}`, sem depender apenas de um link mágico.
   - Manter validade curta (por exemplo 10 minutos) e rate limits adequados.
3. Authentication → SMTP Settings:
   - Configurar SMTP transacional. Se usar Gmail, usar conta empresarial dedicada e palavra-passe de aplicação com 2FA; nunca usar a palavra-passe normal do Gmail.
   - Inserir host, porta, utilizador, palavra-passe de aplicação e remetente no painel Supabase. Estes segredos não pertencem ao GitHub nem ao browser.
   - O envio real de e-mails só funciona depois desta configuração e de o fornecedor aceitar o remetente.
4. Authentication → Security and Protection:
   - Ativar CAPTCHA (Turnstile ou hCaptcha) e ajustar limites de pedidos para mitigar bots e abuso.
5. Criar pelo menos um administrador:
   - Registar primeiro o utilizador pelo `register.html` e confirmar o e-mail.
   - No SQL Editor, localizar o utilizador pelo e-mail e definir a permissão em `raw_app_meta_data` (não em user_metadata):
     `UPDATE auth.users SET raw_app_meta_data = COALESCE(raw_app_meta_data, '{}'::jsonb) || '{"role":"admin"}'::jsonb WHERE email = 'EMAIL_DO_ADMIN';`
   - Substituir pelo endereço real. Executar apenas para pessoas autorizadas. Depois terminar e iniciar sessão novamente para renovar o JWT.
6. Netlify:
   - Publicar a branch/PR depois de revisão. O URL e publishable key presentes em `assets/js/supabase-config.js` são públicos por desenho.
   - Nunca adicionar `service_role`, secret key, senha SMTP ou tokens privados a ficheiros públicos.

## Limites e notas de arquitetura
- O login principal é passwordless OTP: o código de seis dígitos é o fator de acesso. A palavra-passe continua a existir para registo/recuperação e operações futuras, mas o fluxo de entrada não usa password+segundo OTP.
- A autorização de admin no browser controla a apresentação da interface. Qualquer API, tabela ou função que contenha dados de negócio deve também validar JWT e permissões no servidor e aplicar RLS. Não confiar em esconder botões ou páginas.
- O painel antigo guarda produtos e pedidos em localStorage. Esta alteração fecha o painel a utilizadores sem role, mas não converte o armazenamento local em base de dados segura multiutilizador.
- O SDK está fixado em `@supabase/supabase-js@2.57.0` para evitar dependência flutuante; rever e atualizar de forma controlada antes de produção.
