import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { TextDecoder } from "node:util";

import { describe, expect, it } from "vitest";

import { CUSTOMER_SAFE_LINE_DETAIL_LABELS } from "@/lib/quotation/customer-safe-line-details";

const migrationPath = fileURLToPath(
  new URL(
    "../../../../supabase/migrations/20260924000100_create_quotation_snapshots.sql",
    import.meta.url,
  ),
);
const migrationBytes = readFileSync(migrationPath);
const decodeMigrationUtf8 = () =>
  new TextDecoder("utf-8", { fatal: true }).decode(migrationBytes);
const migration = decodeMigrationUtf8();

function tableDefinition(table: "quotations" | "quotation_lines"): string {
  const match = migration.match(
    new RegExp(
      `create table public\\.${table} \\(([\\s\\S]*?)\\n\\);`,
      "i",
    ),
  );

  expect(match).not.toBeNull();
  return match?.[1] ?? "";
}

function saveFunctionDefinition(): string {
  const match = migration.match(
    /create function public\.save_quotation_snapshot\(snapshot jsonb\)([\s\S]*?)\n\$\$;/i,
  );

  expect(match).not.toBeNull();
  return match?.[1] ?? "";
}

function allowedLineDetailLabels(): readonly string[] {
  const match = saveFunctionDefinition().match(
    /or \(detail ->> 'label'\) not in \(\s*([\s\S]*?)\s*\)\s*\n\s*\)\s*\n\s*then/i,
  );

  expect(match).not.toBeNull();

  return Array.from(match?.[1].matchAll(/'([^']+)'/g) ?? [], ([, label]) =>
    label,
  );
}

describe("quotation snapshot migration security contract", () => {
  it("is UTF-8 without BOM and preserves the exact customer-safe label allowlist", () => {
    expect(decodeMigrationUtf8).not.toThrow();
    expect(Array.from(migrationBytes.subarray(0, 3))).not.toEqual([
      0xef, 0xbb, 0xbf,
    ]);
    expect(migration).not.toMatch(/[ÃÂ]/u);

    const sqlLabels = allowedLineDetailLabels();

    expect(sqlLabels).toEqual([...CUSTOMER_SAFE_LINE_DETAIL_LABELS]);
    expect(sqlLabels).toEqual(
      expect.arrayContaining([
        "Categoría",
        "Descripción",
        "Área por unidad",
        "Opción de Panaflex",
        "Clasificación de medida",
        "Opción seleccionada",
        "Duración ingresada",
        "Tipo de impresión",
        "Tamaño aproximado",
        "Producción",
        "Condición",
        "Cámaras",
        "Configuración DVR/NVR",
      ]),
    );
  });

  it("creates normalized historical tables with database-managed identifiers", () => {
    const quotations = tableDefinition("quotations");
    const lines = tableDefinition("quotation_lines");

    expect(quotations).toMatch(
      /id uuid primary key default gen_random_uuid\(\)/i,
    );
    expect(quotations).toMatch(
      /created_at timestamptz not null default now\(\)/i,
    );
    expect(quotations).toMatch(/created_by uuid not null references auth\.users/i);
    expect(quotations).toMatch(/quotation_date date not null/i);
    expect(quotations).toMatch(/validity_days integer not null/i);
    expect(quotations).toMatch(/total_cop bigint not null/i);
    expect(lines).toMatch(
      /id uuid primary key default gen_random_uuid\(\)/i,
    );
    expect(lines).toMatch(/quantity numeric not null/i);
    expect(lines).toMatch(/details jsonb not null/i);
    expect(lines).toMatch(/line_total_cop bigint not null/i);

    for (const column of [
      "customer_name",
      "customer_document",
      "customer_phone_country_iso2",
      "customer_phone_number",
      "customer_email",
      "customer_city",
      "notes",
      "total_cop",
      "created_at",
      "created_by",
    ]) {
      expect(quotations).toMatch(new RegExp(`\\b${column}\\b`, "i"));
    }

    for (const column of [
      "quotation_id",
      "position",
      "source",
      "title",
      "quantity",
      "details",
      "description",
      "unit_price_cop",
      "line_total_cop",
    ]) {
      expect(lines).toMatch(new RegExp(`\\b${column}\\b`, "i"));
    }
  });

  it("preserves ordered lines and intentionally cascades owner-level header cleanup", () => {
    const lines = tableDefinition("quotation_lines");

    expect(lines).toMatch(
      /quotation_id uuid not null references public\.quotations\(id\) on delete cascade/i,
    );
    expect(lines).toMatch(
      /constraint quotation_lines_position_unique unique \(quotation_id, position\)/i,
    );
    expect(lines).toMatch(/check \(position > 0\)/i);
  });

  it("protects exact custom commercial snapshots without constraining standard quantities to integers", () => {
    const lines = tableDefinition("quotation_lines");

    expect(lines).toMatch(/source = 'custom'/i);
    expect(lines).toMatch(/description is not null/i);
    expect(lines).toMatch(/unit_price_cop is not null/i);
    expect(lines).toMatch(/quantity = trunc\(quantity\)/i);
    expect(lines).toMatch(/unit_price_cop between 1 and 9007199254740991/i);
    expect(lines).toMatch(
      /line_total_cop = quantity \* unit_price_cop/i,
    );
    expect(lines).toMatch(/source <> 'custom'[\s\S]*description is null/i);
    expect(lines).not.toMatch(/check \(quantity = trunc\(quantity\)\)/i);
  });

  it("enables RLS and grants authenticated users read-only table access", () => {
    expect(migration).toMatch(
      /alter table public\.quotations enable row level security/i,
    );
    expect(migration).toMatch(
      /alter table public\.quotation_lines enable row level security/i,
    );
    expect(migration.match(/for select\s+to authenticated/gi)).toHaveLength(2);
    expect(migration).toMatch(
      /grant select on table public\.quotations to authenticated/i,
    );
    expect(migration).toMatch(
      /grant select on table public\.quotation_lines to authenticated/i,
    );
    expect(migration).not.toMatch(
      /grant\s+(insert|update|delete|all)[^;]*on table public\.(quotations|quotation_lines)/i,
    );
    expect(migration).not.toMatch(/for\s+(insert|update|delete)\s+to authenticated/i);
  });

  it("revokes anonymous and default access to both tables", () => {
    expect(migration).toMatch(
      /revoke all on table public\.quotations from public, anon, authenticated/i,
    );
    expect(migration).toMatch(
      /revoke all on table public\.quotation_lines from public, anon, authenticated/i,
    );
    expect(migration).not.toMatch(/grant\s+[^;]+\s+to\s+(public|anon)/i);
    expect(migration).not.toMatch(
      /create policy[\s\S]*?on public\.(quotations|quotation_lines)[\s\S]*?to\s+(public|anon)/i,
    );
  });

  it("creates one authenticated atomic RPC with a safe execution context", () => {
    const saveFunction = saveFunctionDefinition();

    expect(saveFunction).toMatch(/language plpgsql/i);
    expect(saveFunction).toMatch(/security definer/i);
    expect(saveFunction).toMatch(/set search_path = ''/i);
    expect(saveFunction).toMatch(/authenticated_user_id uuid := auth\.uid\(\)/i);
    expect(saveFunction).toMatch(/if authenticated_user_id is null/i);
    expect(saveFunction).toMatch(/insert into public\.quotations/i);
    expect(saveFunction).toMatch(/insert into public\.quotation_lines/i);
    expect(saveFunction).toMatch(/calculated_total <> quotation_total/i);
    expect(saveFunction).not.toMatch(/createdBy|created_by'|snapshot ->> 'created/i);
  });

  it("exposes only RPC execution to authenticated users", () => {
    expect(migration).toMatch(
      /revoke all on function public\.save_quotation_snapshot\(jsonb\) from public, anon, authenticated/i,
    );
    expect(migration).toMatch(
      /grant execute on function public\.save_quotation_snapshot\(jsonb\) to authenticated/i,
    );
    expect(migration).not.toMatch(
      /grant execute on function public\.save_quotation_snapshot\(jsonb\) to (public|anon)/i,
    );
  });

  it("accepts only the reviewed customer-safe snapshot fields", () => {
    const saveFunction = saveFunctionDefinition();

    for (const field of [
      "quotationDate",
      "validityDays",
      "customerName",
      "customerDocument",
      "customerPhoneCountryIso2",
      "customerPhoneNumber",
      "customerEmail",
      "customerCity",
      "notes",
      "totalCop",
      "lines",
    ]) {
      expect(saveFunction).toContain(`'${field}'`);
    }

    for (const forbidden of [
      "supplier",
      "purchase_price",
      "internal_cost",
      "margin",
      "profitability",
      "service_role",
    ]) {
      expect(saveFunction.toLowerCase()).not.toContain(forbidden);
    }
  });
});
