begin;

-- Block saves while existing rows are numbered and the insert trigger is installed.
lock table public.quotations in access exclusive mode;

alter table public.quotations
  add column quotation_number text,
  add column status text not null default 'sent',
  add constraint quotations_status_check check (status in ('sent', 'accepted', 'rejected'));

-- The business year is the year of the database save in Bogota, not the
-- editable quotation date. Existing rows use their original creation time.
do $$
begin
  if exists (
    select 1
    from public.quotations
    group by extract(year from created_at at time zone 'America/Bogota')
    having count(*) > 9999
  ) then
    raise exception using errcode = '22003', message = 'Annual historical quotation number limit reached.';
  end if;
end;
$$;

with numbered as (
  select id,
    extract(year from created_at at time zone 'America/Bogota')::integer as business_year,
    row_number() over (
      partition by extract(year from created_at at time zone 'America/Bogota')
      order by created_at, id
    ) as serial
  from public.quotations
)
update public.quotations as quotation
set quotation_number = 'DR-' || lpad(numbered.business_year::text, 4, '0') || '-' || lpad(numbered.serial::text, 4, '0')
from numbered
where quotation.id = numbered.id;

alter table public.quotations
  alter column quotation_number set not null,
  add constraint quotations_number_format_check
    check (quotation_number ~ '^DR-[0-9]{4}-[0-9]{4}$'),
  add constraint quotations_number_unique unique (quotation_number);

create table public.quotation_number_counters (
  business_year integer primary key check (business_year between 1 and 9999),
  last_number integer not null check (last_number between 1 and 9999)
);

insert into public.quotation_number_counters (business_year, last_number)
select split_part(quotation_number, '-', 2)::integer,
  max(split_part(quotation_number, '-', 3)::integer)
from public.quotations
group by split_part(quotation_number, '-', 2)::integer;

alter table public.quotation_number_counters enable row level security;
revoke all on table public.quotation_number_counters from public, anon, authenticated;

create function public.assign_quotation_number()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  business_year integer := extract(year from clock_timestamp() at time zone 'America/Bogota')::integer;
  next_number integer;
begin
  if auth.uid() is null then
    raise exception using errcode = '28000', message = 'Authentication required.';
  end if;

  -- ON CONFLICT locks the year row. Concurrent saves serialize here; a
  -- failed snapshot insert rolls this increment back with the whole RPC.
  insert into public.quotation_number_counters (business_year, last_number)
  values (business_year, 1)
  on conflict (business_year) do update
    set last_number = public.quotation_number_counters.last_number + 1
    where public.quotation_number_counters.last_number < 9999
  returning last_number into next_number;

  if next_number is null then
    raise exception using errcode = '22003', message = 'Annual quotation number limit reached.';
  end if;

  new.quotation_number := 'DR-' || lpad(business_year::text, 4, '0') || '-' || lpad(next_number::text, 4, '0');
  new.status := 'sent';
  return new;
end;
$$;

revoke all on function public.assign_quotation_number() from public, anon, authenticated;

create trigger assign_quotation_number_before_insert
before insert on public.quotations
for each row execute function public.assign_quotation_number();

create function public.change_quotation_status(quotation_id uuid, new_status text)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  saved_status text;
begin
  if auth.uid() is null then
    raise exception using errcode = '28000', message = 'Authentication required.';
  end if;

  if quotation_id is null or new_status is null
    or new_status not in ('sent', 'accepted', 'rejected') then
    raise exception using errcode = '22023', message = 'Invalid quotation status request.';
  end if;

  update public.quotations
  set status = new_status
  where id = quotation_id
  returning status into saved_status;

  if saved_status is null then
    raise exception using errcode = 'P0002', message = 'Quotation not found.';
  end if;

  return saved_status;
end;
$$;

revoke all on function public.change_quotation_status(uuid, text) from public, anon, authenticated;
grant execute on function public.change_quotation_status(uuid, text) to authenticated;

commit;
