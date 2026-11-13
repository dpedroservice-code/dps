import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const read = (path) => readFile(new URL(path, import.meta.url), "utf8");

test("admin access is restricted to the authorised D.PEDRO email", async () => {
  const auth = await read("../assets/js/auth.js");
  assert.ok(auth.includes("const ADMIN_EMAIL = 'dpedroservice@gmail.com'"));
  assert.ok(auth.includes("requireAdminEmail(email)"));
  assert.ok(auth.includes("normalizeEmail(user.email) !== ADMIN_EMAIL"));
});

test("server bridge separates local and Kanawa company IDs", async () => {
  const bridge = await read("../supabase/functions/dps-store-bridge/index.ts");
  assert.ok(bridge.includes('const COMPANY_ID = "d2bf8670-0667-4d44-96ab-8fb8280cf089"'));
  assert.ok(bridge.includes('const KANAWA_COMPANY_ID = "9d57ccbb-7957-4dda-b1c8-1a2b745cef7b"'));
  assert.ok(bridge.includes("apiData.companyId !== KANAWA_COMPANY_ID"));
  assert.ok(bridge.includes("x-api-key"));
  assert.ok(bridge.includes("dps_store_save_api_integration"));
  assert.ok(!bridge.includes("2506d418-4f0f-446a-99c4-a228041a1233"));
});

test("all deployments fail closed until a dedicated D.PEDRO Supabase project is configured", async () => {
  const config = await read("../assets/js/supabase-config.js");
  assert.ok(config.includes("configured: false"));
  assert.ok(config.includes("url: ''"));
  assert.ok(config.includes("publishableKey: ''"));
  assert.ok(config.includes("previewReadOnly: true"));
  assert.ok(!config.includes("jiehrswweoyesbabrpjf"));
  assert.ok(!config.includes("mhaynctedpyqjxdhdisv"));
});

test("the Kanawa API key is entered as a password and sent to the server bridge", async () => {
  const admin = await read("../admin.html");
  const cloud = await read("../assets/js/cloud-store.js");
  assert.ok(admin.includes('id="kanawaApiKey" type="password"'));
  assert.ok(cloud.includes("api_key: cleanKey"));
  assert.ok(cloud.includes("ks_live_"));
  assert.ok(cloud.includes("ecommerce-gateway?action=catalog"));
});

test("storefront migration seeds only the verified D.PEDRO company and endpoint", async () => {
  const migration = await read("../supabase/migrations/20261112184500_allow_kanawa_external_api_url.sql");
  assert.ok(migration.includes("d2bf8670-0667-4d44-96ab-8fb8280cf089"));
  assert.ok(migration.includes("mhaynctedpyqjxdhdisv.supabase.co/functions/v1/ecommerce-gateway?action=catalog"));
  assert.ok(migration.includes("on conflict (slug) do update"));
  assert.ok(migration.includes("from public, anon, authenticated"));
  assert.ok(migration.includes("to service_role"));
});

test("public checkout collects customer data and sends a stable idempotency reference", async () => {
  const cart = await read("../assets/js/cart.js");
  const cloud = await read("../assets/js/cloud-store.js");
  const bridge = await read("../supabase/functions/dps-store-bridge/index.ts");
  assert.ok(cart.includes("collectCustomer"));
  assert.ok(cart.includes("createClientRef"));
  assert.ok(cloud.includes("client_ref: clientRef"));
  assert.ok(cloud.includes("pending.client_ref"));
  assert.ok(bridge.includes("customer_name: customerName"));
  assert.ok(bridge.includes("client_ref: clientRef"));
  assert.ok(bridge.includes("replayed: true"));
});

test("D.PEDRO orders have a unique per-company idempotency key", async () => {
  const migration = await read("../supabase/migrations/20261112184500_allow_kanawa_external_api_url.sql");
  assert.ok(migration.includes("add column if not exists client_ref text"));
  assert.ok(migration.includes("dps_store_orders_company_client_ref_uq"));
});
