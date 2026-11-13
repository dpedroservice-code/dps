export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname === "/health") {
      return Response.json({ ok: true, service: "dpedro-solucoes-preview", hosting: "Cloudflare Workers Static Assets" });
    }
    return env.ASSETS.fetch(request);
  }
};
