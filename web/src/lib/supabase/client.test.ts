import { afterEach, describe, expect, it } from "vitest";

import { createClient } from "./client";

const originalUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const originalPublishableKey =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

afterEach(() => {
  process.env.NEXT_PUBLIC_SUPABASE_URL = originalUrl;
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY = originalPublishableKey;
});

describe("browser Supabase client", () => {
  it("creates an auth-capable client from the public configuration", () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://project.supabase.co";
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY =
      "publishable-test-key";

    const client = createClient();

    expect(client.auth.signInWithPassword).toBeTypeOf("function");
    expect(client.auth.signOut).toBeTypeOf("function");
  });
});
