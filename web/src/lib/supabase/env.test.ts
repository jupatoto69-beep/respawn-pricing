import { describe, expect, it } from "vitest";

import {
  getSupabasePublicConfig,
  SUPABASE_ENVIRONMENT_VARIABLES,
} from "./env";

describe("getSupabasePublicConfig", () => {
  it("returns only the public URL and publishable-key boundary", () => {
    expect(
      getSupabasePublicConfig({
        NEXT_PUBLIC_SUPABASE_URL: " configured-url ",
        NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: " configured-key ",
      }),
    ).toEqual({
      url: "configured-url",
      publishableKey: "configured-key",
    });
  });

  it.each(SUPABASE_ENVIRONMENT_VARIABLES)(
    "rejects configuration without %s",
    (missingName) => {
      const environment = {
        NEXT_PUBLIC_SUPABASE_URL: "configured-url",
        NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "configured-key",
      };

      delete environment[missingName];

      expect(() => getSupabasePublicConfig(environment)).toThrow(
        "Missing required Supabase environment variables",
      );
    },
  );
});
