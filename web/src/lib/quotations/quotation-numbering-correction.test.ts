import { existsSync, readFileSync } from "node:fs";
import { TextDecoder } from "node:util";

import { describe, expect, it } from "vitest";

const originalPath = new URL(
  "../../../../supabase/migrations/20260928000100_quotation_numbering_status.sql",
  import.meta.url,
);
const correctionPath = new URL(
  "../../../../supabase/migrations/20260928000200_fix_quotation_number_counter_conflict.sql",
  import.meta.url,
);
const decoder = new TextDecoder("utf-8", { fatal: true });
const originalSql = decoder.decode(readFileSync(originalPath));
const correctionSql = existsSync(correctionPath)
  ? decoder.decode(readFileSync(correctionPath))
  : "";

function triggerBodies(sql: string): string[] {
  return Array.from(
    sql.matchAll(
      /create(?: or replace)? function public\.assign_quotation_number\(\)[\s\S]*?\bas \$\$([\s\S]*?)\$\$;/giu,
    ),
    (match) => match[1],
  );
}

function ambiguousConflictVariables(body: string): string[] {
  const declarations = body.match(/\bdeclare\b([\s\S]*?)\bbegin\b/iu)?.[1] ?? "";
  const variables = new Set(
    Array.from(
      declarations.matchAll(/^\s*([a-z_][a-z0-9_]*)\s+(?:integer|bigint|text)\b/gimu),
      (match) => match[1].toLowerCase(),
    ),
  );
  return Array.from(
    body.matchAll(/\bon conflict\s*\(\s*([a-z_][a-z0-9_]*)\s*\)/gimu),
    (match) => match[1].toLowerCase(),
  ).filter((column) => variables.has(column));
}

describe("quotation number counter conflict correction", () => {
  it("captures the variable and conflict-column collision in the applied migration", () => {
    const originalBody = triggerBodies(originalSql).at(-1) ?? "";
    expect(ambiguousConflictVariables(originalBody)).toEqual(["business_year"]);
  });

  it("uses a nonambiguous atomic allocator in the effective trigger function", () => {
    const effectiveBody = triggerBodies(`${originalSql}\n${correctionSql}`).at(-1) ?? "";

    expect(ambiguousConflictVariables(effectiveBody)).toEqual([]);
    expect(effectiveBody).toMatch(/on conflict on constraint quotation_number_counters_pkey do update/iu);
    expect(effectiveBody).toMatch(/last_number = public\.quotation_number_counters\.last_number \+ 1/iu);
    expect(effectiveBody).toMatch(/where public\.quotation_number_counters\.last_number < 9999/iu);
    expect(effectiveBody).toMatch(/returning last_number into [a-z_][a-z0-9_]*/iu);
    expect(effectiveBody).toMatch(/new\.quotation_number := 'DR-'/iu);
    expect(effectiveBody).toMatch(/new\.status := 'sent'/iu);
  });

  it("replaces only the trigger function with its original security boundary", () => {
    expect(correctionSql).toMatch(/create or replace function public\.assign_quotation_number\(\)/iu);
    expect(correctionSql).toMatch(/security definer\s+set search_path = ''/iu);
    expect(correctionSql).toMatch(/auth\.uid\(\) is null/iu);
    expect(correctionSql).toMatch(/revoke all on function public\.assign_quotation_number\(\) from public, anon, authenticated/iu);
    expect(correctionSql).not.toMatch(/grant\s+(insert|update|delete|all)\b/iu);
    expect(correctionSql).not.toMatch(/drop (table|trigger|function)|truncate|delete from public\.quotations/iu);
  });
});
