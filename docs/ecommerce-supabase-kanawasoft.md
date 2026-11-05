# Integração e-Commerce D.PEDRO ↔ KanawaSoft 1.2.0

## Fluxo

1. No painel D.PEDRO, um administrador autenticado escolhe **Ligar / emitir chave de API**.
2. A função `ks-store-api` emite uma chave exclusiva para D.PEDRO, com escopo de leitura do catálogo e finalidade registada.
3. O segredo é enviado por HTTPS à função `dps-store-bridge` e guardado no Supabase Vault. O navegador não o persiste nem o volta a apresentar.
4. A sincronização consulta o endpoint `/functions/v1/ks-store-api/catalog/products` em modo somente leitura.
5. Os registos são copiados para `dps_store_products`. Produtos novos entram como rascunho.
6. O administrador filtra por categoria, origem, estado ou pesquisa, revê o catálogo e publica os produtos escolhidos.
7. A loja pública só recebe produtos ativos e publicados.
8. Os pedidos são validados no servidor contra o preço e o stock atuais e guardados em `dps_store_orders` e `dps_store_order_items`.

## Tabelas Supabase

- `dps_storefronts`: slug público e origens autorizadas.
- `dps_store_products`: catálogo manual e catálogo importado, com origem, preço, stock e estado de publicação.
- `dps_store_orders` e `dps_store_order_items`: pedidos partilhados entre dispositivos.
- `dps_store_sync_runs`: histórico de sincronização.
- `dps_store_integrations`: metadados da ligação API; o segredo fica no Vault, não nesta tabela.

As tabelas de catálogo e pedidos têm RLS e políticas por empresa. As tabelas de configuração/segredo não são acessíveis diretamente por clientes anon/authenticated. O Realtime está ativado para catálogo e pedidos.

## Funções Edge

- `ks-store-api`: API do KanawaSoft; a verificação do hash da chave foi corrigida para calcular o hash do token recebido.
- `dps-store-bridge`: emissão/configuração segura, estado da ligação, sincronização, publicação, catálogo público e criação de pedidos.

## Regras de negócio

- A sincronização é unidirecional: KanawaSoft → loja D.PEDRO. Não escreve no ERP.
- Preço e stock de produtos KanawaSoft são atualizados a partir da API. Para alterar esses valores, editar no ERP e sincronizar novamente.
- O estado de publicação é preservado nas sincronizações; produtos novos ficam em rascunho.
- Produtos que deixam de aparecer numa resposta não vazia da API são desativados e retirados da loja; não são apagados.
- Produtos manuais permanecem separados dos produtos importados.
- A validação do pedido não reserva nem baixa stock. O pedido fica em estado awaiting_contact e pagamento not_paid até confirmação humana. Não há gateway de pagamento ativo nesta integração.
- Se o navegador estiver offline durante um checkout, o pedido fica numa fila local para nova tentativa quando a ligação regressar; até ser aceite pelo servidor, não está partilhado entre dispositivos.

## Configuração atual e validação pendente

- Empresa associada: D.PEDRO SOLUÇÕES.
- Slug da loja: `dpedrosolucoes`.
- A chave API é emitida quando o administrador usar o botão no painel; não foi criada automaticamente.
- Na última verificação, `ks_products` não tinha produtos ativos para esta empresa. Portanto, a sincronização ainda não pôde validar uma importação real de produtos.
- Faltam testes reais em browser/telemóvel, confirmação visual do catálogo e um checkout de teste controlado.
