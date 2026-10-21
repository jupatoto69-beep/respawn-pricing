import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

import { AppFrame } from "./app-frame";

vi.mock("./logout-button", () => ({
  LogoutButton: () => <button type="button">Cerrar sesión</button>,
}));

describe("AppFrame", () => {
  it("navigates from a new quotation to saved quotations", () => {
    const markup = renderToStaticMarkup(<AppFrame activePage="new"><p>Cotizador</p></AppFrame>);
    expect(markup).toContain('aria-current="page" href="/"');
    expect(markup).toContain('href="/cotizaciones"');
    expect(markup).toContain("Nueva cotización");
    expect(markup).toContain("Cotizaciones guardadas");
  });

  it("offers a return to the calculator from the saved quotations view", () => {
    const markup = renderToStaticMarkup(<AppFrame activePage="history"><p>Historial</p></AppFrame>);
    expect(markup).toContain('aria-current="page" href="/cotizaciones"');
    expect(markup).toContain('href="/"');
    expect(markup).toContain("Nueva cotización");
  });
});
