import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { BANNER_STANDARD_VARIANT_ID } from "@/lib/pricing/area-product-catalog";
import { BANNER_STRUCTURE_OPTION_IDS } from "@/lib/pricing/banner-structure-options";
import { calculateAreaBasePrice } from "@/lib/pricing/calculate-area-base-price";
import { calculateBannerStructurePrice } from "@/lib/pricing/calculate-banner-structure-price";
import { calculateIlluminatedPanaflexSignPrice } from "@/lib/pricing/calculate-illuminated-panaflex-sign-price";
import { PANAFLEX_PRICING_OPTION_IDS } from "@/lib/pricing/panaflex-pricing-options";
import { PRICING_MODE_IDS } from "@/lib/pricing/pricing-mode-selection";
import { PRINTED_SERVICE_IDS } from "@/lib/pricing/printed-service-catalog";
import { roundUpToCop500 } from "@/lib/pricing/round-up-to-cop-500";
import { SERVICE_CATEGORY_IDS } from "@/lib/pricing/service-catalog";

import { PricingCalculator } from "./pricing-calculator";
import { ServicesPricingCalculator } from "./services-pricing-calculator";

describe("PricingCalculator", () => {
  it("renders the existing area-products calculator by default", () => {
    const markup = renderToStaticMarkup(<PricingCalculator />);

    expect(markup).toContain("Producto, medidas y tarifa");
    expect(markup).toContain("Vinilo impreso");
    expect(markup).toContain("Vinilo de corte");
    expect(markup).toContain("Banner");
    expect(markup).toContain("Panaflex");
    expect(markup).not.toContain("Categoría, servicio y datos");
  });

  it("renders the category-first interface in Services mode", () => {
    const markup = renderToStaticMarkup(
      <PricingCalculator initialModeId={PRICING_MODE_IDS.services} />,
    );

    expect(markup).toContain("Categoría, servicio y datos");
    expect(markup).toContain("Computadores");
    expect(markup).toContain("Audiovisual");
    expect(markup).toContain("Impresos");
    expect(markup).toContain("Selecciona una categoría");
    expect(markup).toContain("Selecciona un servicio");
    expect(markup).not.toContain("Instalación individual de programas");
    expect(markup).not.toContain("Edición de video sencilla");
    expect(markup).not.toContain("Tarjetas de presentación");
    expect(markup).not.toContain("Producto, medidas y tarifa");
  });

  it("shows only computer services when Computers is selected", () => {
    const markup = renderToStaticMarkup(
      <ServicesPricingCalculator
        initialCategoryId={SERVICE_CATEGORY_IDS.computers}
      />,
    );

    expect(markup).toContain("Mantenimiento de computador");
    expect(markup).toContain("Instalación individual de programas");
    expect(markup).toContain("Instalación de Office únicamente");
    expect(markup).not.toContain("Edición de video sencilla");
  });

  it("shows only simple video editing when Audiovisual is selected", () => {
    const markup = renderToStaticMarkup(
      <ServicesPricingCalculator
        initialCategoryId={SERVICE_CATEGORY_IDS.audiovisual}
      />,
    );

    expect(markup).toContain("Audiovisual");
    expect(markup).toContain("Edición de video sencilla");
    expect(markup).not.toContain("Mantenimiento de computador");
    expect(markup).not.toContain("Instalación individual de programas");
    expect(markup).not.toContain("Tarjetas de presentación");
  });

  it("shows business cards only when Printed products is selected", () => {
    const markup = renderToStaticMarkup(
      <ServicesPricingCalculator
        initialCategoryId={SERVICE_CATEGORY_IDS.printedProducts}
      />,
    );

    expect(markup).toContain("Impresos");
    expect(markup).toContain("Tarjetas de presentación");
    expect(markup).not.toContain("Mantenimiento de computador");
    expect(markup).not.toContain("Edición de video sencilla");
  });

  it("renders only business-card pricing fields for the business-card strategy", () => {
    const markup = renderToStaticMarkup(
      <ServicesPricingCalculator
        initialCategoryId={SERVICE_CATEGORY_IDS.printedProducts}
        initialServiceId={PRINTED_SERVICE_IDS.businessCards}
      />,
    );

    expect(markup).toContain("Tipo de tarjeta");
    expect(markup).toContain("Cantidad en millares");
    expect(markup).toContain("Precio negociado por millar (opcional)");
    expect(markup).toContain("1 millar equivale a 1.000 tarjetas");
    expect(markup).not.toContain("Precio del primer minuto");
    expect(markup).not.toContain("Precio por minuto adicional iniciado");
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
