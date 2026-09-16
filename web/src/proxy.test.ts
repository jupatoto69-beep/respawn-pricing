import { unstable_doesMiddlewareMatch } from "next/experimental/testing/server";
import { describe, expect, it } from "vitest";

import { config } from "./proxy";

describe("Proxy matcher", () => {
  it("runs for the pricing application and login routes", () => {
    expect(
      unstable_doesMiddlewareMatch({ config, nextConfig: {}, url: "/" }),
    ).toBe(true);
    expect(
      unstable_doesMiddlewareMatch({ config, nextConfig: {}, url: "/login" }),
    ).toBe(true);
  });

  it("does not run for static Next.js assets or images", () => {
    expect(
      unstable_doesMiddlewareMatch({
        config,
        nextConfig: {},
        url: "/_next/static/chunks/app.js",
      }),
    ).toBe(false);
    expect(
      unstable_doesMiddlewareMatch({
        config,
        nextConfig: {},
        url: "/brand/digital-respawn-logo-white.png",
      }),
    ).toBe(false);
  });
});
