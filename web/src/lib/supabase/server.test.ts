import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  cookieGetAll: vi.fn(),
  cookieSet: vi.fn(),
  createServerClient: vi.fn(),
}));

vi.mock("next/headers", () => ({
  cookies: vi.fn(async () => ({
    getAll: mocks.cookieGetAll,
    set: mocks.cookieSet,
  })),
}));

vi.mock("@supabase/ssr", () => ({
  createServerClient: mocks.createServerClient,
}));

import { createClient } from "./server";

describe("server Supabase client", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.NEXT_PUBLIC_SUPABASE_URL = "configured-url";
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY = "configured-key";
    mocks.createServerClient.mockReturnValue({ auth: {} });
  });

  it("connects the current Next.js cookie store to the SSR client", async () => {
    const existingCookies = [{ name: "existing", value: "cookie" }];
    mocks.cookieGetAll.mockReturnValue(existingCookies);

    const client = await createClient();
    const options = mocks.createServerClient.mock.calls[0][2];

    expect(client).toEqual({ auth: {} });
    expect(mocks.createServerClient).toHaveBeenCalledWith(
      "configured-url",
      "configured-key",
      expect.any(Object),
    );
    expect(options.cookies.getAll()).toEqual(existingCookies);

    options.cookies.setAll([
      {
        name: "session",
        value: "refreshed",
        options: { path: "/", sameSite: "lax" },
      },
    ]);

    expect(mocks.cookieSet).toHaveBeenCalledWith(
      "session",
      "refreshed",
      { path: "/", sameSite: "lax" },
    );
  });

  it("allows Server Components to rely on Proxy when cookie writes are unavailable", async () => {
    mocks.cookieSet.mockImplementation(() => {
      throw new Error("read-only cookie store");
    });

    await createClient();
    const options = mocks.createServerClient.mock.calls[0][2];

    expect(() =>
      options.cookies.setAll([
        { name: "session", value: "refreshed", options: { path: "/" } },
      ]),
    ).not.toThrow();
  });
});
