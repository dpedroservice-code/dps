/* D.PEDRO SOLUÇÕES — Supabase configuration (fail-closed).
 *
 * The only connected projects currently available are:
 * - APP (jiehrswweoyesbabrpjf): contains Kanawa ERP tables and must NOT be reused
 *   as the dedicated D.PEDRO storefront/auth database.
 * - kanawasoft-1-0-isolated (mhaynctedpyqjxdhdisv): KanawaSoft ERP project.
 *
 * Until a dedicated D.PEDRO Supabase project is created and its public URL/key
 * are configured here, all environments stay disconnected. Never fall back to
 * either KanawaSoft project. A public publishable key is not a secret, but it
 * must still belong to the correct D.PEDRO project.
 */
(function () {
  'use strict';
  window.DPEDRO_PREVIEW_READ_ONLY = true;
  window.DPEDRO_SUPABASE_CONFIG = Object.freeze({
    url: '',
    publishableKey: '',
    redirectUrl: window.location.origin,
    previewReadOnly: true,
    configured: false,
    reason: 'A base de dados exclusiva da D.PEDRO ainda não foi configurada.'
  });
})();
