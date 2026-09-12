import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import {
  SECURITY_SYSTEM_PRESENTATION_IDS,
  SECURITY_SYSTEM_TYPE_IDS,
} from "@/lib/pricing/security-system-options";

import { SecuritySystemsPricingCalculator } from "./security-systems-pricing-calculator";

describe("SecuritySystemsPricingCalculator", () => {
  it("renders only the confirmed scaffold controls and catalog notice", () => {
    const markup = renderToStaticMarkup(<SecuritySystemsPricingCalculator />);

    expect(markup).toContain("Tipo de sistema");
    expect(markup).toContain('value="analog"');
    expect(markup).toContain('value="ip"');
    expect(markup).toContain('value="wifi"');
    expect(markup).toContain("Analógico");
    expect(markup).toContain("IP");
    expect(markup).toContain("Wi-Fi");
    expect(markup).toContain("Presentación de la cotización");
    expect(markup).toContain("Desglosada");
    expect(markup).toContain(
      "Muestra al cliente el precio individual de cada componente.",
    );
    expect(markup).toContain("Agrupada");
    expect(markup).toContain(
      "Muestra los componentes del sistema y únicamente el precio total.",
    );
    expect(markup).toContain("Catálogo pendiente");
    expect(markup).toContain(
      "Por ahora no se incluyen modelos, productos ni precios provisionales.",
    );
    expect(markup).not.toContain("Agregar a la cotización");
  });

  it("can initialize the typed system and presentation selection state", () => {
    const markup = renderToStaticMarkup(
      <SecuritySystemsPricingCalculator
        initialSystemTypeId={SECURITY_SYSTEM_TYPE_IDS.wifi}
        initialPresentationId={SECURITY_SYSTEM_PRESENTATION_IDS.bundled}
      />,
    );

    expect(markup).toMatch(/checked="" value="wifi"/);
    expect(markup).toMatch(/checked="" value="bundled"/);
  });
});
