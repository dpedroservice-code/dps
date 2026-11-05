import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.118.0";

const URL = Deno.env.get("SUPABASE_URL")!;
const ANON = Deno.env.get("SUPABASE_ANON_KEY")!;
const SERVICE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const admin = createClient(URL, SERVICE, { auth: { persistSession: false, autoRefreshToken: false } });
const COMPANY_ID = "2506d418-4f0f-446a-99c4-a228041a1233";
const STORE_SLUG = "dpedrosolucoes";

function cors(req: Request) {
  const origin = req.headers.get("Origin") || "";
  return {
    "Access-Control-Allow-Origin": origin || "https://dpedrosolucoes.shop",
    "Access-Control-Allow-Headers": "authorization, apikey, content-type, x-client-info",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Content-Type": "application/json",
    "Vary": "Origin"
  };
}
function json(req: Request, status: number, body: Record<string, unknown>) {
  return new Response(JSON.stringify(body), { status, headers: cors(req) });
}
function mapCategory(value: unknown) {
  const c = String(value || "").trim().toLowerCase();
  if (/cctv|cftv|camera|videovigil/.test(c)) return "cftv";
  if (/alarme|seguran|incend/.test(c)) return "seguranca";
  if (/acesso|biometr|controlo/.test(c)) return "acesso";
  if (/rede|network|router|switch/.test(c)) return "redes";
  if (/solar|energia|eletric/.test(c)) return "energia";
  if (/papel|escrit/.test(c)) return "papelaria";
  if (/graf|design|impress/.test(c)) return "grafica";
  if (/telecom|telefone|telemovel/.test(c)) return "telecom";
  if (/gps|rastre/.test(c)) return "rastreio";
  if (/servi|assist|instal|manuten/.test(c)) return "servicos";
  if (/inform|comput|hardware|software/.test(c)) return "informatica";
  return c ? c.replace(/[^a-z0-9]+/g, "-").slice(0, 50) : "informatica";
}
async function authenticate(req: Request, companyId: string, allowedRoles: string[] = ["owner", "admin"]) {
  const authorization = req.headers.get("Authorization") || "";
  if (!authorization.startsWith("Bearer ")) throw new Error("Sessão autenticada obrigatória.");
  const userClient = createClient(URL, ANON, {
    global: { headers: { Authorization: authorization } },
    auth: { persistSession: false, autoRefreshToken: false }
  });
  const { data: auth, error } = await userClient.auth.getUser();
  if (error || !auth.user) throw new Error("Sessão inválida ou expirada.");
  const { data: membership, error: memberError } = await admin.from("ks_company_memberships")
    .select("role,status").eq("company_id", companyId).eq("user_id", auth.user.id)
    .eq("status", "active").maybeSingle();
  if (memberError || !membership || !allowedRoles.includes(membership.role)) {
    throw new Error("Sem permissão para gerir o catálogo desta empresa.");
  }
  return auth.user;
}
function validOrigin(origin: string | null, allowed: string[] | null) {
  return !origin || !allowed?.length || allowed.includes(origin);
}
async function getStore(slug: string, req: Request) {
  const { data: store, error } = await admin.from("dps_storefronts")
    .select("company_id,slug,allowed_origins,is_active")
    .eq("slug", slug).eq("is_active", true).maybeSingle();
  if (error || !store) throw new Error("Loja não encontrada ou desativada.");
  if (!validOrigin(req.headers.get("Origin"), store.allowed_origins)) throw new Error("Origem não autorizada.");
  return store;
}
async function syncKanawa(req: Request, body: Record<string, unknown>) {
  const companyId = String(body.company_id || COMPANY_ID);
  if (companyId !== COMPANY_ID) return json(req, 403, { ok: false, error: "Empresa não autorizada para esta ligação." });
  await authenticate(req, companyId);
  const started = new Date().toISOString();
  const { data: configRows, error: configError } = await admin.rpc("dps_store_get_api_integration", { p_company_id: companyId });
  const config: any = Array.isArray(configRows) ? configRows[0] : configRows;
  if (configError || !config?.api_url || !config?.api_secret) {
    return json(req, 409, { ok: false, error: "A API do KanawaSoft ainda não está ligada. Use primeiro «Ligar API KanawaSoft»." });
  }
  let apiResponse: Response;
  try {
    apiResponse = await fetch(config.api_url, {
      method: "GET",
      headers: { "Authorization": "Bearer " + config.api_secret, "apikey": ANON, "Accept": "application/json" }
    });
  } catch (_) {
    return json(req, 502, { ok: false, error: "Não foi possível alcançar a API do KanawaSoft." });
  }
  const apiData: any = await apiResponse.json().catch(() => ({}));
  if (!apiResponse.ok || apiData.success !== true || apiData.company_id !== companyId || !Array.isArray(apiData.products)) {
    return json(req, 502, { ok: false, error: "A API do KanawaSoft não confirmou a leitura do catálogo.", upstream_status: apiResponse.status });
  }
  await admin.from("dps_store_integrations").update({ last_connected_at: new Date().toISOString() }).eq("company_id", companyId);
  const source = apiData.products;
  if (!source.length) {
    await admin.from("dps_store_sync_runs").insert({
      company_id: companyId, source: "kanawa", status: "success", total_seen: 0,
      inserted_or_updated: 0, deactivated: 0,
      message: "A API KanawaSoft não devolveu produtos ativos. Nenhum produto foi desativado."
    });
    return json(req, 200, { ok: true, total: 0, imported: 0, deactivated: 0, message: "A API não devolveu produtos ativos. Nenhum produto foi desativado." });
  }
  const { data: existing, error: existingError } = await admin.from("dps_store_products")
    .select("id,source_product_id,is_published").eq("company_id", companyId).eq("source", "kanawa");
  if (existingError) return json(req, 500, { ok: false, error: "Não foi possível preparar a sincronização." });
  const existingByExternal = new Map((existing || []).map((p: any) => [p.source_product_id, p]));
  const rows = source.map((p: any) => {
    const old: any = existingByExternal.get(String(p.external_id));
    return {
      company_id: companyId, source: "kanawa", source_product_id: String(p.external_id),
      sku: p.sku || null, name: String(p.name || "Produto sem nome"),
      category: mapCategory(p.category), unit: p.unit || "UN",
      description: p.description || null, specs: null, image_url: p.image_path || null,
      price: Number(p.unit_price) || 0, stock_quantity: Number(p.stock_quantity) || 0,
      is_published: old?.is_published === true, is_active: true,
      source_updated_at: p.updated_at || null, synced_at: new Date().toISOString()
    };
  });
  const { error: upsertError } = await admin.from("dps_store_products").upsert(rows, { onConflict: "company_id,source,source_product_id" });
  if (upsertError) return json(req, 500, { ok: false, error: "Falha ao guardar produtos sincronizados.", detail: upsertError.message });
  const activeIds = new Set(source.map((p: any) => String(p.external_id)));
  const stale = (existing || []).filter((p: any) => !activeIds.has(String(p.source_product_id)));
  let deactivated = 0;
  for (const p of stale) {
    const { error } = await admin.from("dps_store_products").update({ is_active: false, is_published: false, synced_at: new Date().toISOString() }).eq("id", p.id);
    if (!error) deactivated++;
  }
  const { error: logError } = await admin.from("dps_store_sync_runs").insert({
    company_id: companyId, source: "kanawa", status: deactivated === stale.length ? "success" : "partial",
    total_seen: source.length, inserted_or_updated: rows.length, deactivated,
    message: "Sincronização via API KanawaSoft concluída; publicação continua sob controlo do administrador.",
    started_at: started, finished_at: new Date().toISOString()
  });
  if (logError) console.error("sync audit insert failed", logError.message);
  return json(req, 200, { ok: true, total: source.length, imported: rows.length, deactivated, message: "API consultada e catálogo sincronizado. Produtos novos permanecem em rascunho." });
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors(req) });
  try {
    const url = new URL(req.url);
    if (req.method === "GET" && url.searchParams.get("action") === "public-products") {
      const store = await getStore(url.searchParams.get("store") || STORE_SLUG, req);
      const { data, error } = await admin.from("dps_store_products")
        .select("id,sku,name,category,unit,description,specs,image_url,price,promo_price,stock_quantity,source,source_product_id,updated_at")
        .eq("company_id", store.company_id).eq("is_active", true).eq("is_published", true)
        .order("name");
      if (error) return json(req, 500, { ok: false, error: "Não foi possível carregar a loja." });
      return json(req, 200, { ok: true, store: store.slug, products: data || [] });
    }

    if (req.method !== "POST") return json(req, 405, { ok: false, error: "Método não permitido." });
    const body = await req.json();
    const action = String(body.action || "");

    if (action === "sync-kanawa") return await syncKanawa(req, body);

    if (action === "connect-api") {
      const companyId = String(body.company_id || COMPANY_ID);
      if (companyId !== COMPANY_ID) return json(req, 403, { ok: false, error: "Empresa não autorizada." });
      const user = await authenticate(req, companyId);
      const purpose = String(body.purpose || "").trim();
      if (purpose.length < 5 || purpose.length > 240) return json(req, 422, { ok: false, error: "Indique uma finalidade válida para a chave." });
      const apiName = "D.PEDRO SOLUÇÕES e-Commerce";
      const origins = ["https://dpedrosolucoes.shop","https://www.dpedrosolucoes.shop","https://dpedrosolucoeslda.netlify.app"];
      const { data: previous } = await admin.from("dps_store_integrations").select("api_key_id").eq("company_id", companyId).maybeSingle();
      const authorization = req.headers.get("Authorization") || "";
      const createResponse = await fetch(URL + "/functions/v1/ks-store-api", {
        method: "POST",
        headers: { "Authorization": authorization, "apikey": ANON, "Content-Type": "application/json" },
        body: JSON.stringify({ action: "create-key", company_id: companyId, name: apiName, purpose, allowed_origins: origins })
      });
      const issued: any = await createResponse.json().catch(() => ({}));
      if (!createResponse.ok || issued.success !== true || !issued.secret || !issued.key?.id || !issued.key?.key_prefix) {
        return json(req, 502, { ok: false, error: issued.error || "O KanawaSoft não conseguiu emitir a chave de leitura." });
      }
      const apiUrl = URL + "/functions/v1/ks-store-api/catalog/products";
      const { data: secretId, error: saveError } = await admin.rpc("dps_store_save_api_integration", {
        p_company_id: companyId, p_api_name: apiName, p_api_url: apiUrl, p_purpose: purpose,
        p_api_key_id: issued.key.id, p_api_key_prefix: issued.key.key_prefix,
        p_api_secret: issued.secret, p_created_by: user.id
      });
      if (saveError || !secretId) {
        await fetch(URL + "/functions/v1/ks-store-api", {
          method: "POST",
          headers: { "Authorization": authorization, "apikey": ANON, "Content-Type": "application/json" },
          body: JSON.stringify({ action: "revoke-key", company_id: companyId, key_id: issued.key.id })
        }).catch(() => {});
        return json(req, 500, { ok: false, error: "A chave foi emitida, mas não foi possível guardá-la no Supabase Vault. A chave nova foi revogada." });
      }
      let previousRevoked = true;
      if (previous?.api_key_id && previous.api_key_id !== issued.key.id) {
        try {
          const revokeResponse = await fetch(URL + "/functions/v1/ks-store-api", {
            method: "POST",
            headers: { "Authorization": authorization, "apikey": ANON, "Content-Type": "application/json" },
            body: JSON.stringify({ action: "revoke-key", company_id: companyId, key_id: previous.api_key_id })
          });
          previousRevoked = revokeResponse.ok;
        } catch (_) { previousRevoked = false; }
      }
      return json(req, 200, {
        ok: true, api_name: apiName, api_url: apiUrl, api_key_prefix: issued.key.key_prefix,
        purpose, secret_stored_securely: true, previous_key_revoked: previousRevoked
      });
    }

    if (action === "api-status") {
      const companyId = String(body.company_id || COMPANY_ID);
      if (companyId !== COMPANY_ID) return json(req, 403, { ok: false, error: "Empresa não autorizada." });
      await authenticate(req, companyId);
      const { data, error } = await admin.from("dps_store_integrations")
        .select("api_name,api_url,purpose,api_key_id,api_key_prefix,is_active,last_connected_at,created_at")
        .eq("company_id", companyId).maybeSingle();
      if (error) return json(req, 500, { ok: false, error: "Não foi possível consultar a configuração da API." });
      return json(req, 200, { ok: true, connected: !!data?.is_active, integration: data || null });
    }

    if (action === "create-order") {
      const store = await getStore(String(body.store_slug || STORE_SLUG), req);
      const input = Array.isArray(body.items) ? body.items.slice(0, 40) : [];
      if (!input.length) return json(req, 422, { ok: false, error: "O carrinho está vazio." });
      const quantities = new Map<string, number>();
      for (const item of input) {
        const id = String(item.product_id || "");
        const qty = Number(item.quantity);
        if (!id || !Number.isFinite(qty) || qty <= 0 || qty > 100) return json(req, 422, { ok: false, error: "Produto ou quantidade inválida." });
        quantities.set(id, (quantities.get(id) || 0) + qty);
      }
      const ids = [...quantities.keys()];
      const { data: products, error: productError } = await admin.from("dps_store_products")
        .select("id,source_product_id,sku,name,price,promo_price,stock_quantity")
        .eq("company_id", store.company_id).eq("is_active", true).eq("is_published", true).in("id", ids);
      if (productError || !products || products.length !== ids.length) return json(req, 409, { ok: false, error: "Um ou mais produtos já não estão publicados ou disponíveis." });
      const items = products.map((p: any) => {
        const quantity = quantities.get(p.id) || 0;
        if (quantity > Number(p.stock_quantity)) throw new Error("Stock insuficiente para " + p.name + ".");
        const unitPrice = Number(p.promo_price) > 0 && Number(p.promo_price) < Number(p.price) ? Number(p.promo_price) : Number(p.price);
        return { company_id: store.company_id, product_id: p.id, source_product_id: p.source_product_id, product_name: p.name, sku: p.sku, quantity, unit_price: unitPrice, line_total: Number((quantity * unitPrice).toFixed(2)) };
      });
      const subtotal = Number(items.reduce((sum: number, item: any) => sum + item.line_total, 0).toFixed(2));
      const { data: order, error: orderError } = await admin.from("dps_store_orders").insert({
        company_id: store.company_id, payment_method: String(body.payment_method || "WhatsApp").slice(0, 40),
        status: "awaiting_contact", payment_status: "not_paid", subtotal, total: subtotal,
        source_payload: { channel: "website", stock_reserved: false }
      }).select("id,order_number,status,total").single();
      if (orderError || !order) return json(req, 500, { ok: false, error: "Não foi possível registar o pedido." });
      const itemRows = items.map((item: any) => ({ ...item, order_id: order.id }));
      const { error: itemError } = await admin.from("dps_store_order_items").insert(itemRows);
      if (itemError) {
        await admin.from("dps_store_orders").delete().eq("id", order.id).eq("company_id", store.company_id);
        return json(req, 500, { ok: false, error: "O pedido não pôde ser concluído." });
      }
      return json(req, 201, { ok: true, order });
    }

    const companyId = String(body.company_id || COMPANY_ID);
    if (companyId !== COMPANY_ID) return json(req, 403, { ok: false, error: "Empresa não autorizada." });
    const user = await authenticate(req, companyId, action === "set-published" ? ["owner","admin","manager"] : ["owner","admin"]);
    if (action === "set-published") {
      const id = String(body.product_id || "");
      const published = body.is_published === true;
      const { data: current, error: readError } = await admin.from("dps_store_products")
        .select("id,price,stock_quantity,is_active").eq("company_id", companyId).eq("id", id).maybeSingle();
      if (readError || !current || !current.is_active) return json(req, 404, { ok: false, error: "Produto não encontrado ou inativo." });
      if (published && (Number(current.price) <= 0 || Number(current.stock_quantity) <= 0)) {
        return json(req, 409, { ok: false, error: "Para publicar, o produto precisa de preço válido e stock superior a zero." });
      }
      const { data, error } = await admin.from("dps_store_products").update({ is_published: published })
        .eq("company_id", companyId).eq("id", id).eq("is_active", true)
        .select("id,is_published").maybeSingle();
      if (error || !data) return json(req, 404, { ok: false, error: "Não foi possível atualizar a publicação." });
      return json(req, 200, { ok: true, product: data });
    }
    if (action === "sync-status") {
      const { data, error } = await admin.from("dps_store_sync_runs").select("status,total_seen,inserted_or_updated,deactivated,message,started_at,finished_at")
        .eq("company_id", companyId).order("started_at", { ascending: false }).limit(10);
      if (error) return json(req, 500, { ok: false, error: "Não foi possível consultar o histórico de sincronização." });
      return json(req, 200, { ok: true, runs: data || [] });
    }
    return json(req, 400, { ok: false, error: "Ação desconhecida." });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro interno.";
    const status = /sessão/i.test(message) ? 401 : /sem permissão|origem não autorizada/i.test(message) ? 403 : /stock insuficiente/i.test(message) ? 409 : 500;
    return json(req, status, { ok: false, error: message });
  }
});
