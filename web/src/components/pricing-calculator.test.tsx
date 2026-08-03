import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { BANNER_STANDARD_VARIANT_ID } from "@/lib/pricing/area-product-catalog";
import { BANNER_STRUCTURE_OPTION_IDS } from "@/lib/pricing/banner-structure-options";
import { calculateAreaBasePrice } from "@/lib/pricing/calculate-area-base-price";
import { calculateBannerStructurePrice } from "@/lib/pricing/calculate-banner-structure-price";
import { calculateIlluminatedPanaflexSignPrice } from "@/lib/pricing/calculate-illuminated-panaflex-sign-price";
import { PANAFLEX_PRICING_OPTION_IDS } from "@/lib/pricing/panaflex-pricing-options";
import { PRICING_MODE_IDS } from "@/lib/pricing/pricing-mode-selection";
import { roundUpToCop500 } from "@/lib/pricing/round-up-to-cop-500";

import { PricingCalculator } from "./pricing-calculator";

describe("PricingCalculator", () => {
  it("renders the existing area-products calculator by default", () => {
    const markup = renderToStaticMarkup(<PricingCalculator />);

    expect(markup).toContain("Producto, medidas y tarifa");
    expect(markup).toContain("Vinilo impreso");
    expect(markup).toContain("Vinilo de corte");
    expect(markup).toContain("Banner");
    expect(markup).toContain("Panaflex");
    expect(markup).not.toContain("Servicio y cantidad");
  });

  it("renders only the computer-services interface in Services mode", () => {
    const markup = renderToStaticMarkup(
      <PricingCalculator initialModeId={PRICING_MODE_IDS.services} />,
    );

    expect(markup).toContain("Servicio y cantidad");
    expect(markup).toContain("Categoría");
    expect(markup).toContain("Computadores");
    expect(markup).toContain("Selecciona un servicio");
    expect(markup).toContain("Instalación individual de programas");
    expect(markup).not.toContain("Producto, medidas y tarifa");
  });

  it("preserves the Banner 80 x 300 cm regression result", () => {
    const areaM2 = calculateAreaBasePrice(80, 300, 1, 1);
    const price = calculateBannerStructurePrice(
      areaM2,
      BANNER_STANDARD_VARIANT_ID,
      80_000,
      BANNER_STRUCTURE_OPTION_IDS.singleFace,
    );

    expect(price).toBe(768_000);
    expect(roundUpToCop500(price)).toBe(768_000);
  });

  it("preserves the double-face illuminated Panaflex regression result", () => {
    const price = calculateIlluminatedPanaflexSignPrice(
      50,
      50,
      1,
      PANAFLEX_PRICING_OPTION_IDS.illuminatedDoubleFace,
    );

    expect(price).toBe(133_750);
    expect(roundUpToCop500(price)).toBe(134_000);
  });
});
