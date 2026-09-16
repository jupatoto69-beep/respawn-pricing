export const SUPABASE_ENVIRONMENT_VARIABLES = [
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY",
] as const;

type SupabaseEnvironment = Readonly<Record<string, string | undefined>>;

export type SupabasePublicConfig = Readonly<{
  url: string;
  publishableKey: string;
}>;

export function getSupabasePublicConfig(
  environment: SupabaseEnvironment = process.env,
): SupabasePublicConfig {
  const url = environment.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const publishableKey =
    environment.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.trim();

  if (!url || !publishableKey) {
    throw new Error(
      `Missing required Supabase environment variables: ${SUPABASE_ENVIRONMENT_VARIABLES.join(", ")}`,
    );
  }

  return { url, publishableKey };
}
