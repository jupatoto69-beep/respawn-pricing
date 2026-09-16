import { createBrowserClient } from "@supabase/ssr";

import { getSupabasePublicConfig } from "./env";

export function createClient() {
  const { url, publishableKey } = getSupabasePublicConfig({
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY:
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  });

  return createBrowserClient(url, publishableKey);
}
