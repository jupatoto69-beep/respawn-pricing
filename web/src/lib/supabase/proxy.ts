import {
  createServerClient as createSupabaseServerClient,
  type CookieOptions,
} from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";

import { getAuthenticationRedirect } from "@/lib/auth/route-access";

import {
  getSupabasePublicConfig,
  type SupabasePublicConfig,
} from "./env";

type CookieToSet = Readonly<{
  name: string;
  value: string;
  options: CookieOptions;
}>;

type ProxySupabaseClient = Readonly<{
  auth: Readonly<{
    getClaims: () => PromiseLike<{
      data: { claims?: unknown } | null;
    }>;
  }>;
}>;

type ProxySupabaseClientFactory = (
  url: string,
  publishableKey: string,
  options: {
    cookies: {
      getAll: () => { name: string; value: string }[];
      setAll: (
        cookiesToSet: CookieToSet[],
        headers: Record<string, string>,
      ) => void;
    };
  },
) => ProxySupabaseClient;

type UpdateSessionDependencies = Readonly<{
  createServerClient?: ProxySupabaseClientFactory;
  getConfig?: () => SupabasePublicConfig;
}>;

const PRIVATE_RESPONSE_CACHE_CONTROL = "private, no-store";

export async function updateSession(
  request: NextRequest,
  dependencies: UpdateSessionDependencies = {},
) {
  const createServerClient =
    dependencies.createServerClient ??
    (createSupabaseServerClient as unknown as ProxySupabaseClientFactory);
  const getConfig = dependencies.getConfig ?? getSupabasePublicConfig;
  const { url, publishableKey } = getConfig();
  const pendingCookies = new Map<string, CookieToSet>();
  const requiredHeaders = new Map<string, string>();

  function applySessionState(response: NextResponse) {
    pendingCookies.forEach(({ name, value, options }) => {
      response.cookies.set(name, value, options);
    });
    requiredHeaders.forEach((value, name) => {
      response.headers.set(name, value);
    });
    response.headers.set("Cache-Control", PRIVATE_RESPONSE_CACHE_CONTROL);

    return response;
  }

  let response = NextResponse.next({ request });
  const supabase = createServerClient(url, publishableKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet, headers) {
        cookiesToSet.forEach((cookie) => {
          request.cookies.set(cookie.name, cookie.value);
          pendingCookies.set(cookie.name, cookie);
        });
        Object.entries(headers).forEach(([name, value]) => {
          requiredHeaders.set(name, value);
        });

        response = applySessionState(NextResponse.next({ request }));
      },
    },
  });

  let isAuthenticated = false;

  try {
    const { data } = await supabase.auth.getClaims();
    isAuthenticated = Boolean(data?.claims);
  } catch {
    // A validation or refresh failure must never grant access.
  }

  const redirectPath = getAuthenticationRedirect(
    request.nextUrl.pathname,
    isAuthenticated,
  );

  if (redirectPath) {
    return applySessionState(
      NextResponse.redirect(new URL(redirectPath, request.url)),
    );
  }

  return applySessionState(response);
}
