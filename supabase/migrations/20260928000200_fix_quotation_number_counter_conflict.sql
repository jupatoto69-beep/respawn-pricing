begin;

-- The applied trigger uses business_year as both a PL/pgSQL variable and the
-- ON CONFLICT inference column. PostgreSQL reports that reference as ambiguous
-- when the first new quotation is saved. Keep the counter update transactional.
create or replace function public.assign_quotation_number()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_business_year integer := extract(year from clock_timestamp() at time zone 'America/Bogota')::integer;
  v_next_number integer;
begin
  if auth.uid() is null then
    raise exception using errcode = '28000', message = 'Authentication required.';
  end if;

  insert into public.quotation_number_counters (business_year, last_number)
  values (v_business_year, 1)
  on conflict on constraint quotation_number_counters_pkey do update
    set last_number = public.quotation_number_counters.last_number + 1
    where public.quotation_number_counters.last_number < 9999
  returning last_number into v_next_number;

  if v_next_number is null then
    raise exception using errcode = '22003', message = 'Annual quotation number limit reached.';
  end if;

  new.quotation_number := 'DR-' || lpad(v_business_year::text, 4, '0') || '-' || lpad(v_next_number::text, 4, '0');
  new.status := 'sent';
  return new;
end;
$$;

revoke all on function public.assign_quotation_number() from public, anon, authenticated;

commit;
