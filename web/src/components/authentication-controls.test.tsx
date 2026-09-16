import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    refresh: vi.fn(),
    replace: vi.fn(),
  }),
}));

import { LoginForm } from "./login-form";
import { LogoutButton } from "./logout-button";

describe("authentication controls", () => {
  it("renders the employee login fields and action without public signup", () => {
    const markup = renderToStaticMarkup(<LoginForm />);

    expect(markup).toContain("Correo electrónico");
    expect(markup).toContain("Contraseña");
    expect(markup).toContain("Iniciar sesión");
    expect(markup).toContain('autoComplete="current-password"');
    expect(markup).not.toContain("Registr");
    expect(markup).not.toContain("Olvid");
  });

  it("renders the employee logout action", () => {
    const markup = renderToStaticMarkup(<LogoutButton />);

    expect(markup).toContain("Cerrar sesión");
  });
});
