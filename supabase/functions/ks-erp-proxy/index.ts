import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
const ERP_API_BASE_URL = Deno.env.get("ERP_API_BASE_URL") ?? "";
const ERP_API_KEY = Deno.env.get("ERP_API_KEY") ?? "";
const ERP_API_STORE_ID = Deno.env.get("ERP_API_STORE_ID") ?? "";

const ALLOWED_ORIGINS = new Set([
  "https://dpedrosolucoes.shop",
  "https://dpedrosolucoeslda.netlify.app",
  "http://localhost:3000",
  "http://localhost:5173"
]);

const EVENTS = {
  "product.published": {
    path: "/webhooks/product/published",
    permissions: [["produtos", "editar"]]
  },
  "order.created": {
    path: "/webhooks/order/created",
    permissions: [["pdv", "criar"], ["vendas", "criar"]]
  },
  "order.paid": {
    path: "/webhooks/order/paid",
    permissions: [["financeiro", "aprovar"], ["vendas", "aprovar"]]
  },
  "stock.changed": {
    path: "/webhooks/stock/changed",
    permissions: [["estoque", "editar"]]
  }
};

function json(status: number, body: Record<string, unknown>, origin: string) {
  return new Response(status === 204 ? null : JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "no-store",
      "Access-Control-Allow-Origin": ALLOWED_ORIGINS.has(origin) ? origin : "https://dpedrosolucoes.shop",
      "Access-Control-Allow-Headers": "authorization, apikey, content-type",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Vary": "Origin"
    }
  });
}

function hasPermission(permissions: Record<string, unknown>, module: string, action: string) {
  const actions = permissions[module];
  return Array.isArray(actions) && actions.includes(action);
}

Deno.serve(async (req: Request) => {
  const origin = req.headers.get("origin") ?? "";
  if (req.method === "OPTIONS") return json(204, {}, origin);
  if (req.method !== "POST") return json(405, { error: "Método não permitido." }, origin);
  if (origin && !ALLOWED_ORIGINS.has(origin)) return json(403, { error: "Origem não autorizada." }, origin);

  const authorization = req.headers.get("authorization") ?? "";
  const token = authorization.replace(/^Bearer\s+/i, "").trim();
  if (!token) return json(401, { error: "Sessão não autenticada." }, origin);

  if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
    return json(503, { error: "A função ainda não está configurada no Supabase." }, origin);
  }
  if (!ERP_API_BASE_URL || !ERP_API_KEY || !ERP_API_STORE_ID) {
    return json(503, { error: "Integração ERP indisponível: configure ERP_API_BASE_URL, ERP_API_KEY e ERP_API_STORE_ID nos segredos do Supabase." }, origin);
  }

  let base: URL;
  try {
    base = new URL(ERP_API_BASE_URL);
    if (base.protocol !== "https:") throw new Error("HTTPS obrigatório");
  } catch {
    return json(503, { error: "ERP_API_BASE_URL deve ser um URL HTTPS válido." }, origin);
  }

  try {
    const body = await req.json();
    const companyId = String(body.company_id ?? "");
    const event = String(body.event ?? "");
    const payload = body.payload;
    const eventConfig = EVENTS[event as keyof typeof EVENTS];

    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(companyId)) {
      return json(400, { error: "Empresa inválida." }, origin);
    }
    if (!eventConfig) return json(400, { error: "Evento ERP não permitido." }, origin);
    if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
      return json(400, { error: "Payload inválido." }, origin);
    }
    if (JSON.stringify(payload).length > 64000) return json(413, { error: "Payload excede o limite de 64 KB." }, origin);

    const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
      auth: { persistSession: false, autoRefreshToken: false }
    });
    const { data: authData, error: authError } = await admin.auth.getUser(token);
    if (authError || !authData.user) return json(401, { error: "Sessão inválida ou expirada." }, origin);

    const userId = authData.user.id;
    const { data: membership, error: membershipError } = await admin
      .from("ks_company_memberships")
      .select("role,status,permissions")
      .eq("company_id", companyId)
      .eq("user_id", userId)
      .eq("status", "active")
      .maybeSingle();

    if (membershipError || !membership) return json(403, { error: "Não existe uma associação ativa a esta empresa." }, origin);

    const { data: license, error: licenseError } = await admin
      .from("ks_company_licenses")
      .select("status,expires_at,grace_until")
      .eq("company_id", companyId)
      .maybeSingle();

    if (licenseError || !license) return json(403, { error: "Licença da empresa não encontrada." }, origin);
    const now = Date.now();
    const expiry = license.expires_at ? Date.parse(license.expires_at) : Number.POSITIVE_INFINITY;
    const grace = license.grace_until ? Date.parse(license.grace_until) : 0;
    const licenseValid =
      (["trial", "active"].includes(license.status) && (expiry >= now || grace >= now)) ||
      (license.status === "past_due" && grace >= now);
    if (!licenseValid) return json(403, { error: "A licença da empresa está expirada ou suspensa." }, origin);

    const role = String(membership.role ?? "");
    const elevated = ["owner", "admin"].includes(role);
    const permitted = elevated || eventConfig.permissions.some(([module, action]) =>
      hasPermission((membership.permissions ?? {}) as Record<string, unknown>, module, action)
    );
    if (!permitted) return json(403, { error: "O seu perfil não tem permissão para executar esta integração." }, origin);

    const target = new URL(base.toString().replace(/\/+$/, "") + eventConfig.path);
    const upstream = await fetch(target, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Api-Key": ERP_API_KEY,
        "X-Store-Id": ERP_API_STORE_ID,
        "X-Client": "D.PEDRO-ECOMMERCE"
      },
      body: JSON.stringify({ company_id: companyId, event, payload }),
      signal: AbortSignal.timeout(15000)
    });

    const raw = await upstream.text();
    let data: unknown = null;
    try { data = raw ? JSON.parse(raw) : null; } catch { data = { message: raw.slice(0, 1000) }; }
    if (!upstream.ok) {
      return json(502, {
        error: "O serviço ERP externo recusou ou não concluiu o pedido.",
        upstream_status: upstream.status,
        details: data
      }, origin);
    }
    return json(200, { ok: true, event, upstream_status: upstream.status, data }, origin);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro interno.";
    return json(500, { error: message }, origin);
  }
});
