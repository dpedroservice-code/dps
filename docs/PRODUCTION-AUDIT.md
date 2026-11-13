# Auditoria técnica — D.PEDRO SOLUÇÕES / KanawaSoft

Data da verificação: 2026-11-01  
Repositório analisado: https://github.com/dpedroservice-code/dps  
Branch de trabalho: feat/supabase-email-otp-auth

## Resultado executivo

O repositório contém o website institucional/e-commerce e um painel administrativo simples. **Não contém o código-fonte da aplicação KanawaSoft ERP para Windows**: a página `erp.html` apenas apresenta o produto, planos e um link de download. O ficheiro HTML arquivado em `assets/js/deepseek_html_20261025_c0af23.html` é também uma página institucional/e-commerce monolítica, não o ERP desktop.

Por isso, esta auditoria cobre o website, o painel web, a ligação Supabase disponível e as funções atualmente implantadas. Não é possível validar nem alterar os módulos internos do executável Windows sem o respetivo repositório/código-fonte.

## Constatações verificadas

### Autenticação e permissões
- O PR #2 introduz login por OTP de seis dígitos e substitui a palavra-passe fixa do painel.
- O painel `admin.html` exige atualmente o papel global `app_metadata.role=admin`; não implementa a navegação por permissões de empresa para gerente, operador e caixa.
- A base Supabase já possui `ks_company_memberships`, `ks_team_invitations`, `ks_profiles` e funções privadas para validar papel e permissões por módulo.
- A função de autorização reconhece owner, admin, manager, operator, cashier, accountant e viewer, e aceita ações como ver/criar/editar/excluir/exportar/importar/aprovar/cancelar/configurar.
- Na verificação atual existe apenas um membro ativo com papel owner. Não há contas ativas de gerente, operador ou caixa para testar os seus acessos reais. Logo, a matriz desses perfis ainda não foi validada com utilizadores reais.
- As tabelas centrais de produtos, vendas, clientes, pagamentos, movimentos de stock, convites e configurações de mapas têm RLS ativo. A existência de RLS, por si só, não prova que todas as operações e todos os perfis estejam corretos.

### Dados e módulos web
- `assets/js/db.js`, `assets/js/products.js`, `assets/js/admin.js` e o checkout usam armazenamento local do navegador para produtos e pedidos.
- Dados guardados no localStorage não são partilhados entre funcionários/dispositivos, não são uma fonte de verdade multiutilizador e não ficam protegidos por RLS.
- A página ERP no website é uma página comercial de apresentação e download, não contém os módulos operacionais de PDV, RH, financeiro, compras, logística ou relatórios.

### APIs e integrações
- O antigo `assets/js/erp-bridge.js` devolvia `ok: true` e `simulated: true` quando não havia API key. Isso era um falso positivo de sincronização.
- A lista de plugins (WooCommerce, Shopify, SAFT-AO, Stripe, Multicaixa, WhatsApp e Google Sheets) era apenas uma lista local: o botão podia marcar um plugin como “conectado” sem autenticar ou testar qualquer serviço.
- O Supabase tem uma Edge Function ativa `ks-invite-member`. Não foi encontrada uma função ERP genérica nem endpoints operacionais completos no repositório.
- Foi adicionada nesta branch a função-fonte `ks-erp-proxy`, com validação de JWT, associação ativa, licença, permissões por evento e segredo ERP apenas no servidor. Ela não está implantada nem poderá comunicar com o ERP externo até os segredos e o contrato real da API serem configurados.

### Mapas e logística
- Existe a tabela `ks_map_provider_settings`, configurada com OSRM e Photon públicos e `is_demo_endpoint=true`.
- Esses endpoints são de demonstração/comunitários; não constituem uma integração empresarial com SLA.
- Não foram encontradas tabelas de expedição/encomendas com coordenadas, histórico de localização, nem um módulo de mapa/logística na aplicação web.
- Não foi possível validar tracking real de encomendas porque não existe uma fonte de dados de expedição nem um dispositivo/serviço GPS ligado.

### Alertas Supabase
- Security Advisor: proteção contra palavras-passe comprometidas desativada.
- Performance Advisor: 15 chaves estrangeiras sem índice de cobertura, 9 índices sem utilização registada e 11 tabelas com políticas permissivas sobrepostas. Os avisos devem ser revistos antes de otimização; não remover índices ou políticas automaticamente sem análise de impacto.

## Alterações nesta etapa
- Removida a configuração de API secreta do browser e do localStorage.
- Preparada uma Edge Function server-side para encaminhar quatro eventos ERP permitidos e verificar autenticação, associação, licença e permissão.
- A integração agora deve falhar explicitamente quando estiver sem configuração, sem simular sucesso.
- A lista de plugins deixa de poder declarar uma ligação como ativa apenas por clicar num botão.

## Bloqueios para produção

1. Fornecer o repositório/código-fonte completo do KanawaSoft ERP (não apenas o website institucional nem o instalador Windows).
2. Fornecer a documentação OpenAPI/Swagger ou contrato real dos endpoints ERP. Os caminhos antigos de webhook foram preservados como candidatos, não como endpoints comprovados.
3. Configurar no Supabase Secrets: `ERP_API_BASE_URL`, `ERP_API_KEY`, `ERP_API_STORE_ID`. Nunca inserir estes segredos no browser ou Git.
4. Implantar e testar `ks-erp-proxy` depois da configuração dos segredos e do contrato API.
5. Criar contas de teste para gerente, operador e caixa e executar testes positivos/negativos por módulo.
6. Migrar produtos, pedidos, carrinho, stock e auditoria do localStorage para tabelas Supabase com RLS e testes de políticas.
7. Implementar o módulo logístico (expedições, tracking code, eventos de localização, geocoding, cálculo de rota e distância) ligado a dados reais. Escolher e configurar um fornecedor de mapas de produção; a configuração atual é explicitamente demo.
8. Executar testes de integração, E2E, segurança, recuperação, backups, deploy de preview e validação final antes de produção.

## Critério de aceitação

Não marcar um módulo como pronto até existir: interface ligada a dados persistentes, API real, autorização server-side/RLS, tratamento de falhas, registo de auditoria e testes positivos e negativos para os perfis aplicáveis.
