import { readFileSync } from "node:fs";
import { TextDecoder } from "node:util";
import { describe, expect, it } from "vitest";

const migration = new TextDecoder("utf-8", { fatal: true }).decode(readFileSync(new URL(
  "../../../../supabase/migrations/20261021000100_quotation_management.sql", import.meta.url,
)));
const original = new TextDecoder("utf-8", { fatal: true }).decode(readFileSync(new URL(
  "../../../../supabase/migrations/20260924000100_create_quotation_snapshots.sql", import.meta.url,
)));
const numbering = new TextDecoder("utf-8", { fatal: true }).decode(readFileSync(new URL(
  "../../../../supabase/migrations/20260928000200_fix_quotation_number_counter_conflict.sql", import.meta.url,
)));
const listing = migration.match(/create function public\.list_quotations\([\s\S]*?\n\$\$;/i)?.[0] ?? "";
const deletion = migration.match(/create function public\.delete_quotation\(quotation_id uuid, expected_quotation_number text\)[\s\S]*?\n\$\$;/i)?.[0] ?? "";

describe("quotation management migration contract", () => {
  it("reads commercial fields with invoker permissions, literal partial search, filters, count and a bounded page", () => {
    expect(listing).toMatch(/security invoker[\s\S]*set search_path = ''/i);
    expect(listing).toMatch(/auth\.uid\(\) is null/i);
    for (const field of ["quotation_number", "customer_name", "customer_document", "customer_phone_number", "customer_email", "customer_city"]) {
      expect(listing).toContain(`q.${field} ilike v_search`);
    }
    expect(listing).toMatch(/replace\(replace\(replace\(btrim\(search_term\)/i);
    expect(listing).toMatch(/date_from is null or q\.quotation_date >= date_from/i);
    expect(listing).toMatch(/date_to is null or q\.quotation_date <= date_to/i);
    expect(listing).toMatch(/status_filter = 'expired' and q\.status = 'sent' and q\.quotation_date \+ q\.validity_days < v_today/i);
    expect(listing).toMatch(/status_filter = 'sent' and q\.status = 'sent' and q\.quotation_date \+ q\.validity_days >= v_today/i);
    expect(listing).toMatch(/status_filter in \('accepted', 'rejected'\) and q\.status = status_filter/i);
    expect(listing).toMatch(/now\(\) at time zone 'America\/Bogota'/i);
    expect(listing).toMatch(/f\.id asc/i);
    expect(listing).toMatch(/page_size > 50/i);
    expect(listing).toMatch(/'total', \(select count\(\*\) from filtered\)/i);
    expect(listing).toMatch(/sort_position > \(page_number::bigint - 1\) \* page_size/i);
    expect(listing).not.toMatch(/notes|created_by|cost|supplier|margin|profit/i);
  });

  it("deletes only when both the UUID and exact, case-sensitive number match", () => {
    expect(deletion).toMatch(/security definer[\s\S]*set search_path = ''/i);
    expect(deletion).toMatch(/auth\.uid\(\) is null/i);
    expect(deletion).toMatch(/delete from public\.quotations\s+where id = quotation_id\s+and quotation_number collate "C" = expected_quotation_number collate "C";/);
    expect(deletion).toMatch(/return true;/i);
    expect(original).toMatch(/quotation_id uuid not null references public\.quotations\(id\) on delete cascade/i);
  });

  it("rejects null or invalid inputs before deletion", () => {
    expect(deletion).toMatch(/quotation_id is null or expected_quotation_number is null\s+or expected_quotation_number !~ '\^DR-\[0-9\]\{4\}-\[0-9\]\{4\}\$'/);
    expect(deletion.indexOf("Invalid deletion request.")).toBeLessThan(deletion.indexOf("delete from public.quotations"));
  });

  it("uses the same safe failure for a missing UUID or mismatched number", () => {
    expect(deletion).toMatch(/if not found then\s+raise exception using errcode = 'P0002', message = 'Quotation could not be deleted\.';/);
    expect(deletion).not.toMatch(/select[\s\S]*from public\.quotations/i);
  });

  it("preserves line cascade and never changes quotation number counters", () => {
    expect(original).toMatch(/quotation_id uuid not null references public\.quotations\(id\) on delete cascade/i);
    expect(deletion).not.toMatch(/quotation_number_counters|update |insert |truncate |delete from public\.quotation_lines/i);
    expect(migration).not.toMatch(/quotation_number_counters/i);
    expect(numbering).toMatch(/last_number = public\.quotation_number_counters\.last_number \+ 1/i);
    expect(numbering).toMatch(/on conflict on constraint quotation_number_counters_pkey do update/i);
  });

  it("grants only the two new RPCs and no direct snapshot mutation", () => {
    expect(migration).toMatch(/revoke all on function public\.list_quotations\([^)]+\) from public, anon, authenticated;/i);
    expect(migration).toMatch(/grant execute on function public\.list_quotations\([^)]+\) to authenticated;/i);
    expect(migration).toMatch(/revoke all on function public\.delete_quotation\(uuid, text\) from public, anon, authenticated;/i);
    expect(migration).toMatch(/grant execute on function public\.delete_quotation\(uuid, text\) to authenticated;/i);
    expect(original).toMatch(/revoke all on table public\.quotations from public, anon, authenticated;/i);
    expect(original).toMatch(/grant select on table public\.quotations to authenticated;/i);
    expect(original).not.toMatch(/grant\s+(delete|all)[^;]*on table public\.quotations/i);
    expect(migration).not.toMatch(/grant\s+(insert|update|delete|all)[^;]*on table public\.(quotations|quotation_lines)/i);
    expect(migration).not.toMatch(/(create|alter|drop) policy|disable row level security/i);
    expect(migration.trimEnd()).toMatch(/commit;$/i);
  });
});
