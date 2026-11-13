# dps
website empresaria da dpedro soluções


## Cloudflare preview

This branch prepares an isolated Cloudflare Workers Static Assets preview. The preview deployment workflow requires the GitHub Actions secrets `CLOUDFLARE_API_TOKEN` (Workers Scripts:Edit) and `CLOUDFLARE_ACCOUNT_ID`. It does not bind to the `kanawasoft.shop` zone or modify the Kanawa Soft Worker. The current admin panel is intentionally locked until server-side authentication is configured; browser-only password checks were removed because they are not secure.
