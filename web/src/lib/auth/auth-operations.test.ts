import { describe, expect, it, vi } from "vitest";

import {
  authenticateWithPassword,
  endCurrentSession,
  LOGIN_FAILURE_MESSAGE,
  LOGIN_REQUIRED_FIELDS_MESSAGE,
  LOGOUT_FAILURE_MESSAGE,
} from "./auth-operations";

describe("authenticateWithPassword", () => {
  it("normalizes the email and delegates password login", async () => {
    const signInWithPassword = vi.fn(async () => ({ error: null }));

    await expect(
      authenticateWithPassword(
        { signInWithPassword },
        " employee@example.test ",
        "password-from-form",
      ),
    ).resolves.toEqual({ ok: true });
    expect(signInWithPassword).toHaveBeenCalledWith({
      email: "employee@example.test",
      password: "password-from-form",
    });
  });

  it("presents a safe Spanish error without returning provider details", async () => {
    const providerMessage = "provider-internal-error-detail";
    const signInWithPassword = vi.fn(async () => ({
      error: new Error(providerMessage),
    }));

    const result = await authenticateWithPassword(
      { signInWithPassword },
      "employee@example.test",
      "incorrect-password",
    );

    expect(result).toEqual({ ok: false, message: LOGIN_FAILURE_MESSAGE });
    expect(JSON.stringify(result)).not.toContain(providerMessage);
  });

  it("rejects missing fields without contacting Supabase", async () => {
    const signInWithPassword = vi.fn(async () => ({ error: null }));

    await expect(
      authenticateWithPassword({ signInWithPassword }, "", ""),
    ).resolves.toEqual({
      ok: false,
      message: LOGIN_REQUIRED_FIELDS_MESSAGE,
    });
    expect(signInWithPassword).not.toHaveBeenCalled();
  });
});

describe("endCurrentSession", () => {
  it("ends only the current browser session", async () => {
    const signOut = vi.fn(async () => ({ error: null }));

    await expect(endCurrentSession({ signOut })).resolves.toEqual({ ok: true });
    expect(signOut).toHaveBeenCalledWith({ scope: "local" });
  });

  it("returns a safe Spanish message when logout fails", async () => {
    const signOut = vi.fn(async () => ({
      error: new Error("provider-internal-error-detail"),
    }));

    await expect(endCurrentSession({ signOut })).resolves.toEqual({
      ok: false,
      message: LOGOUT_FAILURE_MESSAGE,
    });
  });
});
