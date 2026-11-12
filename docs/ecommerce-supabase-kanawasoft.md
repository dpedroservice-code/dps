# Integração e-Commerce D.PEDRO ↔ KanawaSoft

## Separação dos ambientes

- Supabase D.PEDRO (loja, autenticação administrativa e pedidos): `jiehrswweoyesbabrpjf`.
- Supabase KanawaSoft (ERP e catálogo de origem): `mhaynctedpyqjxdhdisv`.
- Empresa D.PEDRO no projecto da loja: `d2bf8670-0667-4d44-96ab-8fb8280cf089`.
- Empresa D.PEDRO no KanawaSoft: `9d57ccbb-7957-4dda-b1c8-1a2b745cef7b`.
- Conta administrativa autorizada: `dpedroservice@gmail.com`.

Os dois projectos têm IDs de empresa diferentes. Nunca reutilizar o UUID da empresa D.PEDRO no Supabase da loja como se fosse o UUID da empresa no ERP.

## Fluxo correcto de catálogo

1. No KanawaSoft, abrir **Integrações API** e gerar uma chave para a empresa D.PEDRO SOLUÇÕES com os escopos `catalog:read` e `orders:write`.
2. O endpoint oficial já existente no projecto KanawaSoft é `ecommerce-gateway?action=catalog`; não criar uma segunda API de catálogo.
3. No painel D.PEDRO, o administrador introduz o endpoint oficial e a chave `ks_live_...`.
4. A função `dps-store-bridge` valida a chave por `x-api-key` e confirma que `companyId` corresponde à empresa D.PEDRO no KanawaSoft.
5. A chave é guardada no Vault do projecto D.PEDRO; não é devolvida ao browser nem guardada em localStorage.
6. A sincronização importa os produtos para `dps_store_products` com o UUID local da empresa D.PEDRO. Produtos novos entram como rascunho.
7. O administrador revê e publica os produtos. A loja pública só apresenta produtos activos e publicados.

## Tabelas e serviços

- `ks_ecommerce_api_keys` e `ecommerce-gateway`: já existem no projecto KanawaSoft e são a fonte de chaves, catálogo e recepção de encomendas.
- `dps_storefronts`: slug público e origens autorizadas.
- `dps_store_products`: catálogo manual e importado.
- `dps_store_orders` e `dps_store_order_items`: pedidos recebidos pela loja D.PEDRO.
- `dps_store_sync_runs`: histórico de sincronização.
- `dps_store_integrations`: metadados da integração; o segredo fica no Vault.

A migração `20261112184500_allow_kanawa_external_api_url.sql` prepara a URL externa autorizada e cria o registo da loja. **Ainda não deve ser aplicada ao projecto activo sem autorização e teste num ambiente isolado.**

## Estado verificado e limitações

- A base de dados D.PEDRO tem um único membro activo com perfil `owner`, associado ao e-mail autorizado.
- O código anterior tentava contactar uma API duplicada no próprio projecto D.PEDRO e usava um UUID de empresa errado. A API correcta já existe no KanawaSoft e usa `x-api-key`.
- A empresa D.PEDRO tem UUID diferente em cada projecto; o bridge agora valida o UUID remoto e grava com o UUID local.
- O catálogo da loja está vazio até existir uma sincronização real de produtos e a migração de storefront ser aplicada.
- O gateway KanawaSoft recebe encomendas com escopo `orders:write`, valida produto/preço/stock e cria encomenda pendente. A validação actual não reserva stock atomicamente entre encomendas concorrentes; por isso a escrita automática de encomendas permanece desligada até concluir essa protecção.
- Os pedidos da loja são guardados no Supabase D.PEDRO. A passagem automática para o gateway ERP será activada só depois de testes de idempotência e reserva de stock.
- Não há gateway de pagamento live nem serviço de mapas/rotas pago configurado. Nenhuma chave paga foi comprada ou activada.

## Segurança do painel D.PEDRO

O acesso ao painel administrativo fica restrito ao e-mail `dpedroservice@gmail.com`, com verificação OTP e confirmação adicional no servidor. O Deploy Preview desliga a ligação ao Supabase real para impedir que testes públicos alterem dados de produção.
