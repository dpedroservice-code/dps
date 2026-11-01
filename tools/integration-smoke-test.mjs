#!/usr/bin/env node
/**
 * Read-only smoke test for the Kanawa Soft / D.Pedro / Supabase integration.
 * Requires Node.js 18+ (uses the built-in fetch API).
 *
 * Optional environment:
 *   KANAWA_SITE_URL=https://kanawasoft.shop
 *   DPEDRO_SITE_URL=https://dpedrosolucoeslda.netlify.app
 *   KANAWA_API_BASE_URL=https://api.kanawasoft.ao
 *   SUPABASE_URL=https://<project-ref>.supabase.co
 *   SUPABASE_ANON_KEY=<public-anon-key>
 *
 * This script performs GET requests only. It never creates, updates or deletes data.
 */

const config = {
  kanawaSite: process.env.KANAWA_SITE_URL || 'https://kanawasoft.shop',
  dpedroSite: process.env.DPEDRO_SITE_URL || 'https://dpedrosolucoeslda.netlify.app',
  kanawaApi: process.env.KANAWA_API_BASE_URL || 'https://api.kanawasoft.ao',
  supabaseUrl: process.env.SUPABASE_URL || '',
  supabaseAnonKey: process.env.SUPABASE_ANON_KEY || ''
};

const results = [];

async function check(label, url, options = {}) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 10000);

  try {
    const response = await fetch(url, {
      method: 'GET',
      redirect: 'follow',
      signal: controller.signal,
      headers: {
        accept: 'application/json, text/html;q=0.9, */*;q=0.8',
        ...options.headers
      }
    });

    const result = {
      label,
      url,
      status: response.status,
      ok: response.ok,
      finalUrl: response.url,
      contentType: response.headers.get('content-type') || ''
    };
    results.push(result);
    return result;
  } catch (error) {
    const result = {
      label,
      url,
      ok: false,
      error: error.name === 'AbortError' ? 'timeout (10s)' : error.message
    };
    results.push(result);
    return result;
  } finally {
    clearTimeout(timer);
  }
}

function apiPath(base, path) {
  return new URL(path, base.endsWith('/') ? base : base + '/').toString();
}

async function main() {
  console.log('KANAWA / D.PEDRO — READ-ONLY INTEGRATION CHECK');
  console.log('No POST, PUT, PATCH or DELETE requests will be sent.\n');

  await check('Kanawa Soft Shopping website', config.kanawaSite);
  await check('D.Pedro website', config.dpedroSite);

  const apiBase = config.kanawaApi.replace(/\/+$/, '');
  const healthPaths = ['/api/health', '/v1/health', '/health'];
  const apiHealth = [];

  for (const path of healthPaths) {
    apiHealth.push(await check('Kanawa API health ' + path, apiPath(apiBase, path)));
  }

  const apiHealthy = apiHealth.some(item => item.ok);
  console.log('\nAPI health:', apiHealthy ? 'PASS' : 'NOT CONFIRMED');
  if (!apiHealthy) {
    console.log('No tested health endpoint returned a successful HTTP response.');
  }

  if (config.supabaseUrl && config.supabaseAnonKey) {
    const supabaseBase = config.supabaseUrl.replace(/\/+$/, '');
    const headers = {
      apikey: config.supabaseAnonKey,
      authorization: 'Bearer ' + config.supabaseAnonKey
    };

    await check(
      'Supabase REST gateway',
      supabaseBase + '/rest/v1/',
      { headers: { ...headers, accept: 'application/openapi+json' } }
    );

    await check(
      'Supabase expected Kanawa table (produtos)',
      supabaseBase + '/rest/v1/produtos?select=id&limit=1',
      { headers }
    );
  } else {
    results.push({
      label: 'Supabase checks',
      ok: false,
      skipped: true,
      reason: 'Set SUPABASE_URL and SUPABASE_ANON_KEY to run read-only Supabase checks.'
    });
  }

  console.log('\nRESULTS');
  for (const item of results) {
    const state = item.skipped ? 'SKIP' : item.ok ? 'PASS' : 'FAIL';
    console.log(
      '[' + state + '] ' + item.label +
      (item.status ? ' — HTTP ' + item.status : '') +
      (item.error ? ' — ' + item.error : '') +
      (item.reason ? ' — ' + item.reason : '')
    );
  }

  const failed = results.some(item => !item.ok && !item.skipped);
  const skipped = results.some(item => item.skipped);
  console.log('\nOverall:', failed ? 'CHECKS FAILED / INTEGRATION NOT VERIFIED' :
    skipped ? 'PARTIAL — SUPABASE CHECKS SKIPPED' : 'ALL CONFIGURED READ-ONLY CHECKS PASSED');

  if (failed) process.exitCode = 1;
}

main().catch(error => {
  console.error('Diagnostic failed:', error.message);
  process.exitCode = 1;
});
