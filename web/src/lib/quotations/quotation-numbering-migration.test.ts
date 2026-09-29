import { readFileSync } from "node:fs";
import { TextDecoder } from "node:util";

import { describe, expect, it } from "vitest";

const bytes = readFileSync(new URL(
  "../../../../supabase/migrations/20260928000100_quotation_numbering_status.sql",
  import.meta.url,
));
const migration = new TextDecoder("utf-8", { fatal: true }).decode(bytes);

describe("quotation numbering and status migration contract", () => {
  it("is strict UTF-8 without BOM or mojibake", () => {
    expect(Array.from(bytes.subarray(0, 3))).not.toEqual([0xef, 0xbb, 0xbf]);
    expect(migration).not.toMatch(/[\u00c3\u00c2]/u);
  });

  it("numbers existing quotations deterministically before requiring unique numbers", () => {
    expect(migration).toMatch(/begin;[\s\S]*lock table public\.quotations in access exclusive mode/i);
    expect(migration).toMatch(/row_number\(\) over \([\s\S]*partition by extract\(year from created_at at time zone 'America\/Bogota'\)[\s\S]*order by created_at, id/i);
    expect(migration).toMatch(/update public\.quotations as quotation[\s\S]*set quotation_number =/i);
    expect(migration.indexOf("set quotation_number =")).toBeLessThan(migration.indexOf("alter column quotation_number set not null"));
    expect(migration).toMatch(/constraint quotations_number_unique unique \(quotation_number\)/i);
    expect(migration).toMatch(/insert into public\.quotation_number_counters[\s\S]*max\(split_part\(quotation_number, '-', 3\)::integer\)/i);
    expect(migration).not.toMatch(/drop table|truncate table|delete from public\.quotations/i);
  });

  it("allocates annual numbers atomically inside the existing save INSERT", () => {
    expect(migration).toMatch(/business_year integer primary key/i);
    expect(migration).toMatch(/before insert on public\.quotations[\s\S]*for each row execute function public\.assign_quotation_number\(\)/i);
    expect(migration).toMatch(/on conflict \(business_year\) do update[\s\S]*last_number = public\.quotation_number_counters\.last_number \+ 1[\s\S]*where public\.quotation_number_counters\.last_number < 9999[\s\S]*returning last_number into next_number/i);
    expect(migration).toMatch(/values \(business_year, 1\)/i);
    expect(migration).toMatch(/clock_timestamp\(\) at time zone 'America\/Bogota'/i);
    expect(migration).toMatch(/new\.quotation_number := 'DR-' \|\| lpad\(business_year::text, 4, '0'\) \|\| '-' \|\| lpad\(next_number::text, 4, '0'\)/i);
    expect(migration).toMatch(/new\.status := 'sent'/i);
    expect(migration.trimEnd()).toMatch(/commit;$/i);
  });

  it("limits status changes to one column through authenticated RPC", () => {
    expect(migration).toMatch(/status text not null default 'sent'/i);
    expect(migration).toMatch(/check \(status in \('sent', 'accepted', 'rejected'\)\)/i);
    const updateFunction = migration.match(/create function public\.change_quotation_status\(quotation_id uuid, new_status text\)([\s\S]*?)\n\$\$;/i)?.[1] ?? "";
    expect(updateFunction).toMatch(/security definer[\s\S]*set search_path = ''/i);
    expect(updateFunction).toMatch(/auth\.uid\(\) is null/i);
    expect(updateFunction).toMatch(/new_status not in \('sent', 'accepted', 'rejected'\)/i);
    expect(updateFunction).toMatch(/update public\.quotations\s+set status = new_status\s+where id = quotation_id/i);
    expect(updateFunction).not.toMatch(/set (customer_|quotation_date|validity_days|total_cop|quotation_number|created_)/i);
    expect(migration).toMatch(/revoke all on function public\.change_quotation_status\(uuid, text\) from public, anon, authenticated/i);
    expect(migration).toMatch(/grant execute on function public\.change_quotation_status\(uuid, text\) to authenticated/i);
    expect(migration).not.toMatch(/grant\s+(insert|update|delete|all)[^;]*on table public\.quotations/i);
  });
});
