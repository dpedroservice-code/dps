# Integração e-Commerce D.PEDRO ↔ KanawaSoft

## Separação obrigatória dos ambientes

A verificação da organização Supabase ligada à conta encontrou apenas dois projectos:

- kanawasoft-1-0-isolated (mhaynctedpyqjxdhdisv): projecto activo do KanawaSoft ERP.
- APP (jiehrswweoyesbabrpjf): projecto legado que contém tabelas do ERP KanawaSoft e também tabelas com prefixo dps_.

**Nenhum dos dois é uma base de dados exclusiva da D.PEDRO.** A presença de tabelas dps_* no projecto APP não o transforma num projecto independente. Não reutilizar, migrar, alterar, implantar funções ou guardar novos segredos nesse projecto para a loja D.PEDRO.

A configuração frontend foi colocada em modo fail-closed: sem URL e publishable key, em todos os ambientes, até existir um projecto Supabase dedicado à D.PEDRO.

## Identificadores de empresa

- Empresa D.PEDRO no projecto legado APP: d2bf8670-0667-4d44-96ab-8fb8280cf089.
- Empresa D.PEDRO no KanawaSoft: 9d57ccbb-7957-4dda-b1c8-1a2b745cef7b.

Estes UUIDs pertencem a bases de dados diferentes. Não assumir que o UUID local pode ser reutilizado no ERP.

## Fluxo correcto de catálogo

1. Criar e configurar uma base Supabase dedicada à D.PEDRO, com Auth, tabelas, RLS e Vault.
2. No KanawaSoft, abrir Integrações API e gerar uma chave apenas com catalog:read para a empresa D.PEDRO.
3. O endpoint oficial existente no KanawaSoft é ecommerce-gateway?action=catalog; não criar uma segunda API de catálogo.
4. No painel D.PEDRO, o administrador introduz a chave no campo de password.
5. A Edge Function D.PEDRO valida a chave através de x-api-key e confirma o companyId remoto.
6. A chave é guardada no Vault do projecto D.PEDRO dedicado; nunca é devolvida ao browser nem guardada em localStorage.
7. A sincronização importa os produtos para dps_store_products com o UUID local da empresa D.PEDRO. Produtos novos entram como rascunho.
8. O administrador revê e publica os produtos. A loja pública só apresenta produtos activos e publicados.

## Estado do código e das tabelas

O PR #5 contém código-fonte para dps-store-bridge, tabelas dps_storefronts, dps_store_products, dps_store_orders, dps_store_order_items, dps_store_sync_runs e dps_store_integrations, e a função de gravação de segredo no Vault.

Essas implementações não devem ser consideradas prontas para produção apenas porque existem no repositório ou porque tabelas homónimas aparecem no projecto legado APP. A migration do PR #5 continua por aplicar a qualquer projecto dedicado, e nenhuma migração deve ser aplicada ao APP ou ao KanawaSoft.

## Encomendas e stock

- A loja D.PEDRO deve guardar pedidos no seu próprio Supabase.
- A escrita automática de encomendas no ERP permanece desligada até existir reserva atómica de stock e idempotência verificadas no gateway KanawaSoft.
- Não há pagamento online live configurado.
- Não há fornecedor de mapas/rotas pago configurado.

## Segurança do painel

O acesso administrativo usa OTP por e-mail e validação server-side. O e-mail autorizado no código é dpedroservice@gmail.com. A autenticação só poderá ser testada depois de configurar o projecto dedicado e SMTP/templates de OTP no Supabase.