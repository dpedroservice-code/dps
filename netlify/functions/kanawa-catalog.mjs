// Secure server-side proxy for the Kanawa Soft product catalogue.
// Configure KANAWA_ECOMMERCE_API_KEY in Netlify environment variables.
export default async (request) => {
  if (request.method !== 'GET') return new Response(JSON.stringify({error:'Método não permitido.'}), {status:405,headers:{'Content-Type':'application/json','Allow':'GET'}});
  const key = Netlify.env.get('KANAWA_ECOMMERCE_API_KEY');
  if (!key) return new Response(JSON.stringify({error:'Integração ainda não configurada: falta a chave API no ambiente seguro do site.'}), {status:503,headers:{'Content-Type':'application/json','Cache-Control':'no-store'}});
  try {
    const upstream = await fetch('https://mhaynctedpyqjxdhdisv.supabase.co/functions/v1/ecommerce-gateway?action=catalog', {
      headers:{'x-api-key':key,'Accept':'application/json'},
      signal:AbortSignal.timeout(12000)
    });
    return new Response(await upstream.text(), {status:upstream.status,headers:{'Content-Type':'application/json','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'}});
  } catch (error) {
    return new Response(JSON.stringify({error:'Não foi possível contactar o catálogo Kanawa Soft.'}), {status:502,headers:{'Content-Type':'application/json','Cache-Control':'no-store'}});
  }
};
