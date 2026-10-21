import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

import SavedQuotationsPage from "./page";

vi.mock("@/lib/supabase/server", () => ({
  createClient: async () => ({ auth: { getClaims: async () => ({ data: { claims: { sub: "user" } } }) } }),
}));

vi.mock("@/components/quotation-history", () => ({
  QuotationHistory: () => <div data-testid="saved-history">Historial cargado</div>,
}));

vi.mock("@/components/logout-button", () => ({
  LogoutButton: () => <button type="button">Cerrar sesión</button>,
}));

describe("SavedQuotationsPage", () => {
  it("renders the dedicated history under the protected app navigation", async () => {
    const markup = renderToStaticMarkup(await SavedQuotationsPage());
    expect(markup).toContain("Cotizaciones guardadas");
    expect(markup).toContain("Historial cargado");
    expect(markup).toContain('href="/"');
    expect(markup).toContain('aria-current="page" href="/cotizaciones"');
  });
});
