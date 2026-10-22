begin;

-- Read only, invoker rights: the existing SELECT grant and RLS policy apply.
create function public.list_quotations(
  search_term text,
  status_filter text,
  date_from date,
  date_to date,
  sort_order text,
  page_number integer,
  page_size integer
)
returns jsonb
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_search text;
  v_today date := (now() at time zone 'America/Bogota')::date;
  v_result jsonb;
begin
  if auth.uid() is null then
    raise exception using errcode = '28000', message = 'Authentication required.';
  end if;

  if search_term is null or char_length(btrim(search_term)) > 120
    or status_filter is null or status_filter not in ('all', 'sent', 'accepted', 'rejected', 'expired')
    or sort_order is null or sort_order not in ('recent', 'oldest', 'number_asc', 'number_desc', 'customer_asc', 'customer_desc', 'total_desc', 'total_asc')
    or page_number is null or page_number < 1 or page_number > 1000000
    or page_size is null or page_size < 1 or page_size > 50
    or (date_from is not null and date_to is not null and date_from > date_to) then
    raise exception using errcode = '22023', message = 'Invalid quotation list request.';
  end if;

  -- Escape ILIKE metacharacters so user input remains a literal substring.
  v_search := '%' || replace(replace(replace(btrim(search_term), E'\\', E'\\\\'), '%', E'\\%'), '_', E'\\_') || '%';

  with filtered as (
    select q.id, q.quotation_number, q.status, q.quotation_date,
      q.validity_days, q.customer_name, q.total_cop, q.created_at
    from public.quotations q
    where (
      btrim(search_term) = ''
      or q.quotation_number ilike v_search escape E'\\'
      or q.customer_name ilike v_search escape E'\\'
      or q.customer_document ilike v_search escape E'\\'
      or q.customer_phone_number ilike v_search escape E'\\'
      or q.customer_email ilike v_search escape E'\\'
      or q.customer_city ilike v_search escape E'\\'
    )
      and (date_from is null or q.quotation_date >= date_from)
      and (date_to is null or q.quotation_date <= date_to)
      and (
        status_filter = 'all'
        or (status_filter = 'sent' and q.status = 'sent' and q.quotation_date + q.validity_days >= v_today)
        or (status_filter = 'expired' and q.status = 'sent' and q.quotation_date + q.validity_days < v_today)
        or (status_filter in ('accepted', 'rejected') and q.status = status_filter)
      )
  ), ordered as (
    select f.*, row_number() over (order by
      case when sort_order = 'recent' then f.created_at end desc nulls last,
      case when sort_order = 'oldest' then f.created_at end asc nulls last,
      case when sort_order = 'number_asc' then f.quotation_number end asc nulls last,
      case when sort_order = 'number_desc' then f.quotation_number end desc nulls last,
      case when sort_order = 'customer_asc' then lower(f.customer_name) end asc nulls last,
      case when sort_order = 'customer_desc' then lower(f.customer_name) end desc nulls last,
      case when sort_order = 'total_desc' then f.total_cop end desc nulls last,
      case when sort_order = 'total_asc' then f.total_cop end asc nulls last,
      f.id asc
    ) as sort_position
    from filtered f
  ), page_rows as (
    select * from ordered
    where sort_position > (page_number::bigint - 1) * page_size
      and sort_position <= page_number::bigint * page_size
  )
  select jsonb_build_object(
    'total', (select count(*) from filtered),
    'quotations', coalesce((
      select jsonb_agg(to_jsonb(p) - 'sort_position' order by p.sort_position)
      from page_rows p
    ), '[]'::jsonb)
  ) into v_result;

  return v_result;
end;
$$;

revoke all on function public.list_quotations(text, text, date, date, text, integer, integer) from public, anon, authenticated;
grant execute on function public.list_quotations(text, text, date, date, text, integer, integer) to authenticated;

-- The existing quotation_lines foreign key cascades in the same transaction.
create function public.delete_quotation(quotation_id uuid, expected_quotation_number text)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
begin
  if auth.uid() is null then
    raise exception using errcode = '28000', message = 'Authentication required.';
  end if;

  if quotation_id is null or expected_quotation_number is null
    or expected_quotation_number !~ '^DR-[0-9]{4}-[0-9]{4}$' then
    raise exception using errcode = '22023', message = 'Invalid deletion request.';
  end if;

  delete from public.quotations
  where id = quotation_id
    and quotation_number collate "C" = expected_quotation_number collate "C";
  if not found then
    raise exception using errcode = 'P0002', message = 'Quotation could not be deleted.';
  end if;

  return true;
end;
$$;

revoke all on function public.delete_quotation(uuid, text) from public, anon, authenticated;
grant execute on function public.delete_quotation(uuid, text) to authenticated;

create index quotations_created_at_id_idx on public.quotations (created_at desc, id);
create index quotations_status_date_idx on public.quotations (status, quotation_date);
create index quotations_date_idx on public.quotations (quotation_date);

commit;
