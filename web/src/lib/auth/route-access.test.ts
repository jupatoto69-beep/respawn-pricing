import { describe, expect, it } from "vitest";

import { getAuthenticationRedirect } from "./route-access";

describe("getAuthenticationRedirect", () => {
  it("redirects an unauthenticated protected request to login", () => {
    expect(getAuthenticationRedirect("/", false)).toBe("/login");
  });

  it("keeps the login page available while unauthenticated", () => {
    expect(getAuthenticationRedirect("/login", false)).toBeNull();
  });

  it("keeps the pricing application reachable while authenticated", () => {
    expect(getAuthenticationRedirect("/", true)).toBeNull();
  });

  it("redirects an authenticated login request without creating a loop", () => {
    expect(getAuthenticationRedirect("/login", true)).toBe("/");
  });
});
