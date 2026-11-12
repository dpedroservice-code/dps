import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const read = (path) => readFile(new URL(path, import.meta.url), "utf8");

test("admin access is restricted to the authorised D.PEDRO email", async () => {
  const auth = await read("../assets/js/auth.js");
  assert.match(auth, /const ADMIN_EMAIL = 'dpedroservice@gmail\.com'/);
  assert.match(auth, /requireAdminEmail\(email\)/);
  assert.match(auth, /normalizeEmail\(user\.email\) !== ADMIN_EMAIL/);
});

test("server bridge separates local and Kanawa company IDs", async () => {
  const bridge = await read("../supabase/functions/dps-store-bridge/index.ts");
  assert.match(bridge, /const COMPANY_ID = "d2bf8670-0667-4d44-96ab-8fb8280cf089"/);
  assert.match(bridge, /const KANAWA_COMPANY_ID = "9d57ccbb-7957-4dda-b1c8-1a2b745cef7b"/);
  assert.match(bridge, /apiData\.companyId !== KANAWA_COMPANY_ID/);
  assert.match(bridge, /x-api-key/);
  assert.match(bridge, /dps_store_save_api_integration/);
  assert.doesNotMatch(bridge, /2506d418-4f0f-446a-99c4-a228041a1233/);
});

test("deploy previews cannot connect to the production D.PEDRO database", async () => {
  const config = await read("../assets/js/supabase-config.js");
  assert.match(config, /isNetlifyPreview/);
  assert.match(config, /publishableKey: ""/);
  assert.match(config, /previewReadOnly: true/);
});

test("the Kanawa API key is entered as a password and sent to the server bridge", async () => {
  const admin = await read("../admin.html");
  const cloud = await read("../assets/js/cloud-store.js");
  assert.match(admin, /id="kanawaApiKey" type="password"/);
  assert.match(cloud, /api_key: cleanKey/);
  assert.match(cloud, /ks_live_\[A-Za-z0-9\]\{32,43\}/);
  assert.match(cloud, /ecommerce-gateway\?action=catalog/);
});

test("storefront migration seeds only the verified D.PEDRO company and endpoint", async () => {
  const migration = await read("../supabase/migrations/20261112184500_allow_kanawa_external_api_url.sql");
  assert.match(migration, /d2bf8670-0667-4d44-96ab-8fb8280cf089/);
  assert.match(migration, /mhaynctedpyqjxdhdisv\.supabase\.co\/functions\/v1\/ecommerce-gateway\?action=catalog/);
  assert.match(migration, /on conflict \(slug\) do update/);
});
