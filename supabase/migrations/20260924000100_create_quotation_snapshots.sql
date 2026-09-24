create table public.quotations (
  id uuid primary key default gen_random_uuid(),
  quotation_date date not null,
  validity_days integer not null,
  customer_name text,
  customer_document text,
  customer_phone_country_iso2 text,
  customer_phone_number text,
  customer_email text,
  customer_city text,
  notes text,
  total_cop bigint not null,
  created_at timestamptz not null default now(),
  created_by uuid not null references auth.users(id) on delete restrict,

  constraint quotations_customer_name_check
    check (
      customer_name is null
      or char_length(btrim(customer_name)) between 2 and 120
    ),
  constraint quotations_validity_days_check
    check (validity_days between 1 and 3650),
  constraint quotations_customer_document_check
    check (
      customer_document is null
      or (
        customer_document ~ '^[0-9 -]+$'
        and char_length(regexp_replace(customer_document, '[^0-9]', '', 'g')) between 5 and 15
      )
    ),
  constraint quotations_customer_phone_pair_check
    check ((customer_phone_country_iso2 is null) = (customer_phone_number is null)),
  constraint quotations_customer_phone_country_check
    check (
      customer_phone_country_iso2 is null
      or customer_phone_country_iso2 in ('CO', 'US', 'MX', 'ES', 'VE', 'EC', 'PE', 'CL', 'AR', 'BR', 'PA')
    ),
  constraint quotations_customer_phone_number_check
    check (customer_phone_number is null or customer_phone_number ~ '^[0-9]{7,14}$'),
  constraint quotations_customer_phone_e164_length_check
    check (
      customer_phone_number is null
      or char_length(
        case customer_phone_country_iso2
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
        end || customer_phone_number
      ) <= 15
    ),
  constraint quotations_customer_email_check
    check (
      customer_email is null
      or (
        char_length(customer_email) <= 254
        and customer_email ~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$'
      )
    ),
  constraint quotations_customer_city_check
    check (
      customer_city is null
      or char_length(btrim(customer_city)) between 2 and 100
    ),
  constraint quotations_notes_check
    check (notes is null or char_length(notes) between 1 and 1000),
  constraint quotations_total_cop_check
    check (total_cop between 0 and 9007199254740991)
);

create table public.quotation_lines (
  id uuid primary key default gen_random_uuid(),
  quotation_id uuid not null references public.quotations(id) on delete cascade,
  position integer not null,
  source text not null,
  title text not null,
  quantity numeric not null,
  details jsonb not null default '[]'::jsonb,
  description text,
  unit_price_cop bigint,
  line_total_cop bigint not null,

  constraint quotation_lines_position_unique unique (quotation_id, position),
  constraint quotation_lines_position_check check (position > 0),
  constraint quotation_lines_source_check
    check (source in ('area-product', 'service', 'security-system', 'custom')),
  constraint quotation_lines_title_check
    check (char_length(btrim(title)) between 1 and 200),
  constraint quotation_lines_quantity_check
    check (quantity > 0 and quantity <= 9007199254740991),
  constraint quotation_lines_details_check
    check (jsonb_typeof(details) = 'array'),
  constraint quotation_lines_total_check
    check (line_total_cop between 0 and 9007199254740991),
  constraint quotation_lines_custom_snapshot_check
    check (
      (
        source = 'custom'
        and description is not null
        and char_length(btrim(description)) between 1 and 200
        and description = btrim(description)
        and title = description
        and quantity = trunc(quantity)
        and unit_price_cop is not null
        and unit_price_cop between 1 and 9007199254740991
        and line_total_cop = quantity * unit_price_cop
        and details = '[]'::jsonb
      )
      or
      (
        source <> 'custom'
        and description is null
        and unit_price_cop is null
      )
    )
);

create function public.save_quotation_snapshot(snapshot jsonb)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  authenticated_user_id uuid := auth.uid();
  quotation_id uuid;
  quotation_total bigint;
  quotation_validity_days integer;
  calculated_total bigint := 0;
  quotation_lines jsonb;
  quotation_line jsonb;
  line_details jsonb;
  line_quantity numeric;
  line_total bigint;
  line_unit_price bigint;
  line_position integer := 0;
begin
  if authenticated_user_id is null then
    raise exception using errcode = '28000', message = 'Authentication required.';
  end if;

  if jsonb_typeof(snapshot) <> 'object' then
    raise exception using errcode = '22023', message = 'Invalid quotation snapshot.';
  end if;

  if exists (
    select 1
    from jsonb_object_keys(snapshot) as snapshot_keys(snapshot_key)
    where snapshot_key not in (
      'quotationDate',
      'validityDays',
      'customerName',
      'customerDocument',
      'customerPhoneCountryIso2',
      'customerPhoneNumber',
      'customerEmail',
      'customerCity',
      'notes',
      'totalCop',
      'lines'
    )
  ) then
    raise exception using errcode = '22023', message = 'Unexpected quotation snapshot field.';
  end if;

  if not (snapshot ?& array[
    'quotationDate',
    'validityDays',
    'customerName',
    'customerDocument',
    'customerPhoneCountryIso2',
    'customerPhoneNumber',
    'customerEmail',
    'customerCity',
    'notes',
    'totalCop',
    'lines'
  ]) then
    raise exception using errcode = '22023', message = 'Incomplete quotation snapshot.';
  end if;

  if jsonb_typeof(snapshot -> 'quotationDate') <> 'string'
    or (snapshot ->> 'quotationDate') !~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}$'
    or jsonb_typeof(snapshot -> 'validityDays') <> 'number'
    or (snapshot ->> 'validityDays') !~ '^[0-9]+$'
    or jsonb_typeof(snapshot -> 'totalCop') <> 'number'
    or (snapshot ->> 'totalCop') !~ '^[0-9]+$'
    or jsonb_typeof(snapshot -> 'lines') <> 'array'
  then
    raise exception using errcode = '22023', message = 'Invalid quotation snapshot values.';
  end if;

  foreach quotation_line in array array[
    snapshot -> 'customerName',
    snapshot -> 'customerDocument',
    snapshot -> 'customerPhoneCountryIso2',
    snapshot -> 'customerPhoneNumber',
    snapshot -> 'customerEmail',
    snapshot -> 'customerCity',
    snapshot -> 'notes'
  ] loop
    if jsonb_typeof(quotation_line) not in ('string', 'null') then
      raise exception using errcode = '22023', message = 'Invalid quotation customer snapshot.';
    end if;
  end loop;

  quotation_total := (snapshot ->> 'totalCop')::bigint;
  quotation_validity_days := (snapshot ->> 'validityDays')::integer;
  quotation_lines := snapshot -> 'lines';

  if quotation_validity_days not between 1 and 3650
    or quotation_total > 9007199254740991
    or jsonb_array_length(quotation_lines) < 1
    or jsonb_array_length(quotation_lines) > 500
  then
    raise exception using errcode = '22023', message = 'Invalid quotation total or line count.';
  end if;

  for quotation_line in
    select value from jsonb_array_elements(quotation_lines)
  loop
    line_position := line_position + 1;

    if jsonb_typeof(quotation_line) <> 'object'
      or not (quotation_line ?& array['source', 'title', 'quantity', 'details', 'lineTotalCop'])
      or exists (
        select 1
        from jsonb_object_keys(quotation_line) as line_keys(line_key)
        where line_key not in (
          'source',
          'title',
          'quantity',
          'details',
          'description',
          'unitPriceCop',
          'lineTotalCop'
        )
      )
    then
      raise exception using errcode = '22023', message = 'Invalid quotation line.';
    end if;

    if jsonb_typeof(quotation_line -> 'source') <> 'string'
      or (quotation_line ->> 'source') not in ('area-product', 'service', 'security-system', 'custom')
      or jsonb_typeof(quotation_line -> 'title') <> 'string'
      or char_length(btrim(quotation_line ->> 'title')) not between 1 and 200
      or jsonb_typeof(quotation_line -> 'quantity') <> 'number'
      or jsonb_typeof(quotation_line -> 'details') <> 'array'
      or jsonb_typeof(quotation_line -> 'lineTotalCop') <> 'number'
      or (quotation_line ->> 'lineTotalCop') !~ '^[0-9]+$'
    then
      raise exception using errcode = '22023', message = 'Invalid quotation line values.';
    end if;

    line_quantity := (quotation_line ->> 'quantity')::numeric;
    line_details := quotation_line -> 'details';
    line_total := (quotation_line ->> 'lineTotalCop')::bigint;

    if line_quantity <= 0
      or line_quantity > 9007199254740991
      or line_total > 9007199254740991
      or jsonb_array_length(line_details) > 100
      or exists (
        select 1
        from jsonb_array_elements(line_details) as line_detail(detail)
        where jsonb_typeof(detail) <> 'object'
          or not (detail ?& array['label', 'value'])
          or exists (
            select 1
            from jsonb_object_keys(detail) as detail_keys(detail_key)
            where detail_key not in ('label', 'value')
          )
          or jsonb_typeof(detail -> 'label') <> 'string'
          or jsonb_typeof(detail -> 'value') <> 'string'
          or char_length(detail ->> 'label') not between 1 and 100
          or char_length(btrim(detail ->> 'value')) not between 1 and 500
          or (detail ->> 'label') not in (
            'Producto', 'Servicio', 'Categoría', 'Descripción', 'Configuración',
            'Variante', 'Color', 'Dimensiones', 'Área por unidad', 'Estructura',
            'Opción de Panaflex', 'Clasificación de medida', 'Opción seleccionada',
            'Paquete', 'Unidad', 'Cantidad de programas', 'Alcance',
            'Duración ingresada', 'Minutos facturables', 'Tipo',
            'Cantidad en millares', 'Acabado adhesivo', 'Laminado', 'Material',
            'Gramos por unidad', 'Tiempo de impresión por unidad', 'Modelado',
            'Tipo de impresión', 'Impresora', 'Tamaño aproximado', 'Producción',
            'Condición', 'Sistema', 'Presentación', 'Cámaras', 'Instalación',
            'Grabador', 'Disco duro', 'Configuración DVR/NVR', 'Switch PoE',
            'Fuente centralizada', 'Accesorio adicional', 'Cableado'
          )
      )
    then
      raise exception using errcode = '22023', message = 'Invalid quotation line snapshot.';
    end if;

    if quotation_line ->> 'source' = 'custom' then
      if not (quotation_line ?& array['description', 'unitPriceCop'])
        or jsonb_typeof(quotation_line -> 'description') <> 'string'
        or jsonb_typeof(quotation_line -> 'unitPriceCop') <> 'number'
        or (quotation_line ->> 'unitPriceCop') !~ '^[0-9]+$'
        or btrim(quotation_line ->> 'description') <> (quotation_line ->> 'description')
        or (quotation_line ->> 'description') <> (quotation_line ->> 'title')
        or line_quantity <> trunc(line_quantity)
        or jsonb_array_length(line_details) <> 0
      then
        raise exception using errcode = '22023', message = 'Invalid custom quotation line.';
      end if;

      line_unit_price := (quotation_line ->> 'unitPriceCop')::bigint;

      if line_unit_price <= 0
        or line_unit_price > 9007199254740991
        or line_quantity * line_unit_price <> line_total
      then
        raise exception using errcode = '22023', message = 'Invalid custom quotation line total.';
      end if;
    elsif quotation_line ? 'description' or quotation_line ? 'unitPriceCop' then
      raise exception using errcode = '22023', message = 'Unexpected standard quotation line field.';
    end if;

    if line_total > 9007199254740991 - calculated_total then
      raise exception using errcode = '22023', message = 'Quotation total exceeds the safe range.';
    end if;

    calculated_total := calculated_total + line_total;
  end loop;

  if calculated_total <> quotation_total then
    raise exception using errcode = '22023', message = 'Quotation total does not match its lines.';
  end if;

  insert into public.quotations (
    quotation_date,
    validity_days,
    customer_name,
    customer_document,
    customer_phone_country_iso2,
    customer_phone_number,
    customer_email,
    customer_city,
    notes,
    total_cop,
    created_by
  ) values (
    (snapshot ->> 'quotationDate')::date,
    quotation_validity_days,
    nullif(snapshot ->> 'customerName', ''),
    nullif(snapshot ->> 'customerDocument', ''),
    case when nullif(snapshot ->> 'customerPhoneNumber', '') is null
      then null
      else nullif(snapshot ->> 'customerPhoneCountryIso2', '')
    end,
    nullif(snapshot ->> 'customerPhoneNumber', ''),
    nullif(snapshot ->> 'customerEmail', ''),
    nullif(snapshot ->> 'customerCity', ''),
    nullif(snapshot ->> 'notes', ''),
    quotation_total,
    authenticated_user_id
  )
  returning id into quotation_id;

  line_position := 0;

  for quotation_line in
    select value from jsonb_array_elements(quotation_lines)
  loop
    line_position := line_position + 1;

    insert into public.quotation_lines (
      quotation_id,
      position,
      source,
      title,
      quantity,
      details,
      description,
      unit_price_cop,
      line_total_cop
    ) values (
      quotation_id,
      line_position,
      quotation_line ->> 'source',
      quotation_line ->> 'title',
      (quotation_line ->> 'quantity')::numeric,
      quotation_line -> 'details',
      case when quotation_line ->> 'source' = 'custom'
        then quotation_line ->> 'description'
        else null
      end,
      case when quotation_line ->> 'source' = 'custom'
        then (quotation_line ->> 'unitPriceCop')::bigint
        else null
      end,
      (quotation_line ->> 'lineTotalCop')::bigint
    );
  end loop;

  return quotation_id;
end;
$$;

alter table public.quotations enable row level security;
alter table public.quotation_lines enable row level security;

revoke all on table public.quotations from public, anon, authenticated;
revoke all on table public.quotation_lines from public, anon, authenticated;
grant select on table public.quotations to authenticated;
grant select on table public.quotation_lines to authenticated;

create policy "Authenticated employees can read quotations"
on public.quotations
for select
to authenticated
using (true);

create policy "Authenticated employees can read quotation lines"
on public.quotation_lines
for select
to authenticated
using (true);

revoke all on function public.save_quotation_snapshot(jsonb) from public, anon, authenticated;
grant execute on function public.save_quotation_snapshot(jsonb) to authenticated;
