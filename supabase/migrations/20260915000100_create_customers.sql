create table public.customers (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  document text,
  phone_country_iso2 text,
  phone_number text,
  email text,
  city text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint customers_name_length_check
    check (char_length(btrim(name)) between 2 and 120),
  constraint customers_document_format_check
    check (
      document is null
      or (
        document ~ '^[0-9 -]+$'
        and char_length(regexp_replace(document, '[^0-9]', '', 'g')) between 5 and 15
      )
    ),
  constraint customers_phone_pair_check
    check ((phone_country_iso2 is null) = (phone_number is null)),
  constraint customers_phone_country_check
    check (
      phone_country_iso2 is null
      or phone_country_iso2 in ('CO', 'US', 'MX', 'ES', 'VE', 'EC', 'PE', 'CL', 'AR', 'BR', 'PA')
    ),
  constraint customers_phone_number_check
    check (phone_number is null or phone_number ~ '^[0-9]{7,14}$'),
  constraint customers_phone_e164_length_check
    check (
      phone_number is null
      or char_length(
        case phone_country_iso2
          when 'CO' then '57'
          when 'US' then '1'
          when 'MX' then '52'
          when 'ES' then '34'
          when 'VE' then '58'
          when 'EC' then '593'
          when 'PE' then '51'
          when 'CL' then '56'
          when 'AR' then '54'
          when 'BR' then '55'
          when 'PA' then '507'
        end || phone_number
      ) <= 15
    ),
  constraint customers_email_length_check
    check (email is null or char_length(email) <= 254),
  constraint customers_email_format_check
    check (email is null or email ~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$'),
  constraint customers_city_length_check
    check (city is null or char_length(btrim(city)) between 2 and 100),
  constraint customers_optional_values_not_blank_check
    check (
      (document is null or char_length(btrim(document)) > 0)
      and (phone_number is null or char_length(btrim(phone_number)) > 0)
      and (email is null or char_length(btrim(email)) > 0)
      and (city is null or char_length(btrim(city)) > 0)
    )
);

create function public.set_customers_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger customers_set_updated_at
before update on public.customers
for each row
execute function public.set_customers_updated_at();

alter table public.customers enable row level security;

revoke all on table public.customers from anon, authenticated;
grant select on table public.customers to authenticated;
grant insert (
  name,
  document,
  phone_country_iso2,
  phone_number,
  email,
  city
) on table public.customers to authenticated;
grant update (
  name,
  document,
  phone_country_iso2,
  phone_number,
  email,
  city
) on table public.customers to authenticated;

create policy "Authenticated employees can read customers"
on public.customers
for select
to authenticated
using (true);

create policy "Authenticated employees can create customers"
on public.customers
for insert
to authenticated
with check (true);

create policy "Authenticated employees can update customers"
on public.customers
for update
to authenticated
using (true)
with check (true);

revoke execute on function public.set_customers_updated_at() from public, anon, authenticated;
