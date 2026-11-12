# Integração e-Commerce D.PEDRO ↔ KanawaSoft

## Separação dos ambientes

- Supabase D.PEDRO (loja, autenticação administrativa e pedidos): `jiehrswweoyesbabrpjf`.
- Supabase KanawaSoft (ERP e catálogo de origem): `mhaynctedpyqjxdhdisv`.
- Empresa D.PEDRO no projecto da loja: `d2bf8670-0667-4d44-96ab-8fb8280cf089`.
- Empresa D.PEDRO no KanawaSoft: `9d57ccbb-7957-4dda-b1c8-1a2b745cef7b`.
- Conta administrativa autorizada: `dpedroservice@gmail.com`.

Os dois projectos têm IDs de empresa diferentes. Nunca reutilizar o UUID da empresa D.PEDRO no Supabase da loja como se fosse o UUID da empresa no ERP.

## Fluxo correcto de catálogo

1. No KanawaSoft, um administrador da empresa D.PEDRO SOLUÇÕES gera uma chave de API com escopo somente de leitura do catálogo.
2. A função `ks-store-api` tem de estar publicada no projecto Supabase do KanawaSoft, não no projecto Supabase da loja D.PEDRO.
3. No painel D.PEDRO, o administrador introduz o endpoint oficial e a chave `ks_live_...`.
4. A função `dps-store-bridge` valida a chave no endpoint remoto e confirma que a resposta pertence à empresa D.PEDRO no KanawaSoft.
5. A chave é guardada no Vault do projecto D.PEDRO; não é devolvida ao browser nem guardada em localStorage.
6. A sincronização importa os produtos para `dps_store_products` com o UUID local da empresa D.PEDRO. Produtos novos entram como rascunho.
7. O administrador revê e publica os produtos. A loja pública só apresenta produtos activos e publicados.

## Configuração de servidor necessária

No projecto Supabase D.PEDRO, configurar o segredo da função `dps-store-bridge`:

- `KANAWA_SUPABASE_PUBLISHABLE_KEY`: publishable key do projecto KanawaSoft.

Nunca colocar service_role, segredo privado ou API key Kanawa em ficheiros JavaScript públicos.

## Tabelas da loja

- `dps_storefronts`: slug público e origens autorizadas.
- `dps_store_products`: catálogo manual e importado.
- `dps_store_orders` e `dps_store_order_items`: pedidos partilhados entre dispositivos.
- `dps_store_sync_runs`: histórico de sincronização.
- `dps_store_integrations`: metadados da integração; o segredo fica no Vault.

A migração `20261112184500_allow_kanawa_external_catalog_api.sql` prepara a URL externa autorizada e cria o registo da loja. **Ainda não deve ser aplicada ao projecto activo sem autorização e teste num ambiente isolado.**

## Estado verificado e limitações

- A base de dados D.PEDRO tem um único membro activo com perfil `owner`, associado ao e-mail autorizado.
- O código anterior tentava contactar `ks-store-api` no próprio projecto D.PEDRO e usava um UUID de empresa que não corresponde ao registo real. Essa ligação não podia funcionar com o ERP principal.
- A correcção de código separa o UUID local D.PEDRO do UUID remoto KanawaSoft e exige uma chave API emitida no ERP.
- A função `ks-store-api` ainda precisa de ser publicada no projecto KanawaSoft e de uma interface no ERP para emitir/revogar chaves.
- O catálogo da loja está vazio até existir uma sincronização real de produtos.
- Os pedidos ficam guardados no projecto D.PEDRO; **ainda não são convertidos em encomendas/vendas no KanawaSoft**.
- A criação de pedidos não reserva stock no ERP. Antes de activar checkout real, é necessário criar endpoint idempotente no ERP, validar stock/preço e decidir a reserva temporária.
- Não há gateway de pagamento live nem API de mapas/rotas configurada. Nenhuma chave paga foi comprada ou activada.

## Segurança do painel D.PEDRO

O acesso ao painel administrativo fica restrito ao e-mail `dpedroservice@gmail.com`, com verificação OTP e confirmação adicional no servidor. O Deploy Preview desliga a ligação ao Supabase real para impedir que testes públicos alterem dados de produção.
