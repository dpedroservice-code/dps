-- D.PEDRO e-commerce: permit only the KanawaSoft catalog endpoint and initialise the public storefront.
-- This migration is source-only until explicitly applied to the D.PEDRO Supabase project.

create or replace function public.dps_store_save_api_integration(
  p_company_id uuid,
  p_api_name text,
  p_api_url text,
  p_purpose text,
  p_api_key_id uuid,
  p_api_key_prefix text,
  p_api_secret text,
  p_created_by uuid
)
returns uuid
language plpgsql
security definer
set search_path to ''
as $function$
declare
  v_secret_id uuid;
begin
  if p_api_secret is null or length(p_api_secret) < 40 then
    raise exception 'API secret inválido';
  end if;
  if p_api_url <> 'https://mhaynctedpyqjxdhdisv.supabase.co/functions/v1/ecommerce-gateway?action=catalog' then
    raise exception 'Endpoint da API não autorizado';
  end if;
  select secret_id into v_secret_id
  from public.dps_store_integrations
  where company_id = p_company_id;
  if v_secret_id is null then
    v_secret_id := vault.create_secret(p_api_secret, p_api_name, p_purpose);
  else
    perform vault.update_secret(v_secret_id, p_api_secret, p_api_name, p_purpose, null);
  end if;
  insert into public.dps_store_integrations(
    company_id, api_name, api_url, purpose, api_key_id, api_key_prefix,
    secret_id, is_active, created_by, updated_at
  ) values (
    p_company_id, p_api_name, p_api_url, p_purpose, p_api_key_id, p_api_key_prefix,
    v_secret_id, true, p_created_by, now()
  )
  on conflict (company_id) do update set
    api_name = excluded.api_name,
    api_url = excluded.api_url,
    purpose = excluded.purpose,
    api_key_id = excluded.api_key_id,
    api_key_prefix = excluded.api_key_prefix,
    secret_id = excluded.secret_id,
    is_active = true,
    created_by = excluded.created_by,
    updated_at = now();
  return v_secret_id;
end;
$function$;

insert into public.dps_storefronts(company_id, slug, allowed_origins, is_active, updated_at)
values (
  'd2bf8670-0667-4d44-96ab-8fb8280cf089'::uuid,
  'dpedrosolucoes',
  array[
    'https://dpedrosolucoes.shop',
    'https://www.dpedrosolucoes.shop',
    'https://dpedrosolucoeslda.netlify.app'
  ],
  true,
  now()
)
on conflict (slug) do update set
  company_id = excluded.company_id,
  allowed_origins = excluded.allowed_origins,
  is_active = true,
  updated_at = now();
