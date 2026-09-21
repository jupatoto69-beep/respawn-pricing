import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

const migrationPath = fileURLToPath(
  new URL(
    "../../../../supabase/migrations/20260915000100_create_customers.sql",
    import.meta.url,
  ),
);
const migration = readFileSync(migrationPath, "utf8");
const editableCustomerColumns = [
  "name",
  "document",
  "phone_country_iso2",
  "phone_number",
  "email",
  "city",
];
const databaseManagedCustomerColumns = ["id", "created_at", "updated_at"];

function getAuthenticatedGrantedColumns(operation: "insert" | "update") {
  const grants = [
    ...migration.matchAll(
      new RegExp(
        `grant\\s+${operation}\\s*\\(([^)]+)\\)\\s+on\\s+table\\s+public\\.customers\\s+to\\s+authenticated\\s*;`,
        "gi",
      ),
    ),
  ];

  expect(grants).toHaveLength(1);

  return grants[0][1]
    .split(",")
    .map((column) => column.trim().toLowerCase())
    .sort();
}

describe("customer migration security contract", () => {
  it("creates the customer schema and database-maintained timestamps", () => {
    expect(migration).toMatch(/create table public\.customers/i);
    expect(migration).toMatch(/id uuid primary key default gen_random_uuid\(\)/i);
    expect(migration).toMatch(/created_at timestamptz not null default now\(\)/i);
    expect(migration).toMatch(/updated_at timestamptz not null default now\(\)/i);
    expect(migration).toMatch(/before update on public\.customers/i);
  });

  it("enables RLS and keeps the authenticated customer policies", () => {
    expect(migration).toMatch(
      /alter table public\.customers enable row level security/i,
    );
    expect(migration.match(/create policy /gi)).toHaveLength(3);
    expect(migration.match(/for (select|insert|update)\s+to authenticated/gi)).toHaveLength(3);
    expect(migration).not.toMatch(/disable row level security/i);
  });

  it("allows authenticated users to select customers", () => {
    expect(migration).toMatch(
      /grant\s+select\s+on\s+table\s+public\.customers\s+to\s+authenticated\s*;/i,
    );
  });

  it.each(["insert", "update"] as const)(
    "allows authenticated users to %s only supported customer columns",
    (operation) => {
      expect(getAuthenticatedGrantedColumns(operation)).toEqual(
        [...editableCustomerColumns].sort(),
      );
      expect(migration).not.toMatch(
        new RegExp(
          `grant\\s+${operation}\\s+on\\s+table\\s+public\\.customers`,
          "i",
        ),
      );
    },
  );

  it("does not grant authenticated writes to database-managed columns", () => {
    const writableColumns = new Set([
      ...getAuthenticatedGrantedColumns("insert"),
      ...getAuthenticatedGrantedColumns("update"),
    ]);

    for (const column of databaseManagedCustomerColumns) {
      expect(writableColumns).not.toContain(column);
    }
  });

  it("explicitly revokes anonymous access and grants anon no customer privileges", () => {
    expect(migration).toMatch(
      /revoke all on table public\.customers from anon, authenticated/i,
    );
    expect(migration).not.toMatch(/grant\s+[^;]*\s+to\s+anon/i);
  });

  it("defines no DELETE policy or privilege", () => {
    expect(migration).not.toMatch(/for\s+delete/i);
    expect(migration).not.toMatch(/grant\s+delete/i);
  });
});
