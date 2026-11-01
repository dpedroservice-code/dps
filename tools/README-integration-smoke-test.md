# Read-only integration smoke tests

This folder contains an **additive diagnostic utility**. It does not replace or edit any existing application code.

## What it checks

- Availability of the Kanawa Soft Shopping website.
- Availability of the D.Pedro website.
- Candidate read-only health endpoints on the Kanawa API:
  - `/api/health` (the route currently declared in the Kanawa server source)
  - `/v1/health` (the prefix currently used by the D.Pedro ERP bridge)
  - `/health`
- Supabase REST gateway and the expected `produtos` table, when Supabase credentials are supplied.

The script uses **GET requests only**. It does not create, edit, delete, migrate, or restore records. It never prints the Supabase key.

## Run

Requires Node.js 18 or later.

Linux/macOS:
```bash
KANAWA_API_BASE_URL="https://api.kanawasoft.ao" \
KANAWA_SITE_URL="https://kanawasoft.shop" \
DPEDRO_SITE_URL="https://dpedrosolucoeslda.netlify.app" \
SUPABASE_URL="https://YOUR-PROJECT.supabase.co" \
SUPABASE_ANON_KEY="YOUR-ANON-KEY" \
node tools/integration-smoke-test.mjs
```

Windows PowerShell:
```powershell
$env:KANAWA_API_BASE_URL="https://api.kanawasoft.ao"
$env:KANAWA_SITE_URL="https://kanawasoft.shop"
$env:DPEDRO_SITE_URL="https://dpedrosolucoeslda.netlify.app"
$env:SUPABASE_URL="https://YOUR-PROJECT.supabase.co"
$env:SUPABASE_ANON_KEY="YOUR-ANON-KEY"
node tools/integration-smoke-test.mjs
```

Use only the Supabase **anon/publishable key** here, never the service-role key. Keep secrets in environment variables and do not commit them.

## Interpretation

- A successful website response confirms that the site responds; it does **not** prove that checkout, orders, or ERP synchronization work.
- A successful API health response confirms only that the health endpoint responds; it does **not** prove every API route or business operation works.
- A missing `produtos` table or a denied request means Supabase persistence is not verified.
- The script is a diagnostic baseline. It deliberately does not send test orders or mutate production data.
