/* Configuração pública do Supabase.
 * Deploy Previews não podem aceder ao banco real de D.PEDRO.
 * A publishable key é pública; service_role/secret nunca deve estar no browser.
 */
(function () {
  const host = window.location.hostname.toLowerCase();
  const isNetlifyPreview = host.endsWith("--dpedrosolucoeslda.netlify.app") &&
    host !== "dpedrosolucoeslda.netlify.app" &&
    host !== "main--dpedrosolucoeslda.netlify.app";
  window.DPEDRO_PREVIEW_READ_ONLY = isNetlifyPreview;
  window.DPEDRO_SUPABASE_CONFIG = Object.freeze(isNetlifyPreview ? {
    url: "",
    publishableKey: "",
    redirectUrl: window.location.origin,
    previewReadOnly: true
  } : {
    url: "https://jiehrswweoyesbabrpjf.supabase.co",
    publishableKey: "sb_publishable_l9HL3zMMJ5rN7vnXUZPa1g_9ZA1q7PO",
    redirectUrl: window.location.origin,
    previewReadOnly: false
  });
})();
