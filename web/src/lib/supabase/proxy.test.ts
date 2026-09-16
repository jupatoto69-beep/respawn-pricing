import { NextRequest } from "next/server";
import { describe, expect, it, vi } from "vitest";

import { updateSession } from "./proxy";

const TEST_CONFIG = {
  url: "configured-url",
  publishableKey: "configured-key",
};

function createRequest(pathname: string) {
  return new NextRequest(`https://respawn-pricing.test${pathname}`);
}

function createClientFactory(
  claims: unknown,
  onGetClaims?: (cookies: {
    getAll: () => { name: string; value: string }[];
    setAll: (
      cookiesToSet: Array<{
        name: string;
        value: string;
        options: { path?: string; sameSite?: "lax" };
      }>,
      headers: Record<string, string>,
    ) => void;
  }) => void,
) {
  return vi.fn((url, publishableKey, options) => {
    expect(url).toBe(TEST_CONFIG.url);
    expect(publishableKey).toBe(TEST_CONFIG.publishableKey);

    return {
      auth: {
        getClaims: async () => {
          onGetClaims?.(options.cookies);
          return { data: { claims } };
        },
      },
    };
  });
}

describe("updateSession", () => {
  it("redirects an unauthenticated protected request to login", async () => {
    const response = await updateSession(createRequest("/"), {
      createServerClient: createClientFactory(null),
      getConfig: () => TEST_CONFIG,
    });

    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe(
      "https://respawn-pricing.test/login",
    );
  });

  it("leaves login available while unauthenticated", async () => {
    const response = await updateSession(createRequest("/login"), {
      createServerClient: createClientFactory(null),
      getConfig: () => TEST_CONFIG,
    });

    expect(response.status).toBe(200);
    expect(response.headers.get("location")).toBeNull();
  });

  it("allows authenticated access to the pricing application", async () => {
    const response = await updateSession(createRequest("/"), {
      createServerClient: createClientFactory({ sub: "employee" }),
      getConfig: () => TEST_CONFIG,
    });

    expect(response.status).toBe(200);
    expect(response.headers.get("location")).toBeNull();
  });

  it("redirects an authenticated login request to the pricing application", async () => {
    const response = await updateSession(createRequest("/login"), {
      createServerClient: createClientFactory({ sub: "employee" }),
      getConfig: () => TEST_CONFIG,
    });

    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe(
      "https://respawn-pricing.test/",
    );
  });

  it("synchronizes refreshed cookies and cache headers on request and response", async () => {
    const request = createRequest("/");
    const createServerClient = createClientFactory(
      { sub: "employee" },
      (cookies) => {
        expect(cookies.getAll()).toEqual([]);
        cookies.setAll(
          [
            {
              name: "session",
              value: "refreshed",
              options: { path: "/", sameSite: "lax" },
            },
          ],
          {
            "Cache-Control":
              "private, no-cache, no-store, must-revalidate, max-age=0",
            Expires: "0",
            Pragma: "no-cache",
          },
        );
      },
    );

    const response = await updateSession(request, {
      createServerClient,
      getConfig: () => TEST_CONFIG,
    });

    expect(request.cookies.get("session")?.value).toBe("refreshed");
    expect(response.cookies.get("session")?.value).toBe("refreshed");
    expect(response.headers.get("cache-control")).toContain("no-store");
    expect(response.headers.get("expires")).toBe("0");
    expect(response.headers.get("pragma")).toBe("no-cache");
  });

  it("fails closed when validated claims cannot be obtained", async () => {
    const createServerClient = vi.fn(() => ({
      auth: {
        getClaims: async () => {
          throw new Error("validation unavailable");
        },
      },
    }));

    const response = await updateSession(createRequest("/"), {
      createServerClient,
      getConfig: () => TEST_CONFIG,
    });

    expect(response.headers.get("location")).toBe(
      "https://respawn-pricing.test/login",
    );
  });
});
