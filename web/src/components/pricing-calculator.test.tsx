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

import { PanaflexPricingBreakdown } from "./area-pricing-calculator";
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
    expect(markup).toContain("Cotización temporal");
    expect(markup).toContain("Datos de la cotización");
    expect(markup).toContain(
      "Esta información es temporal y se perderá al recargar la página.",
    );
    expect(markup).toContain("Aún no has agregado productos o servicios.");
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
    expect(markup).not.toContain("Tabloides");
    expect(markup).not.toContain("Producto, medidas y tarifa");
    expect(markup).toContain("Cotización temporal");
    expect(markup).toContain("Datos de la cotización");
    expect(markup).toContain("Aún no has agregado productos o servicios.");
  });

  it("renders three top-level modes and opens 3D directly", () => {
    const markup = renderToStaticMarkup(
      <PricingCalculator initialModeId={PRICING_MODE_IDS.threeDPrinting} />,
    );

    expect(markup).toContain("Productos por área");
    expect(markup).toContain("Servicios");
    expect(markup).toContain("Impresión 3D");
    expect(markup).toContain("Impresión 3D: cotización precisa");
    expect(markup).toContain("Gramos por unidad");
    expect(markup).not.toContain("Categoría, servicio y datos");
    expect(markup).not.toContain("Selecciona una categoría");
    expect(markup).not.toContain("Selecciona un servicio");
    expect(markup).not.toContain("Tarjetas de presentación");
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
    expect(markup).not.toContain("Tabloides");
  });

  it("shows business cards and tabloids only when Printed products is selected", () => {
    const markup = renderToStaticMarkup(
      <ServicesPricingCalculator
        initialCategoryId={SERVICE_CATEGORY_IDS.printedProducts}
      />,
    );

    expect(markup).toContain("Impresos");
    expect(markup).toContain("Tarjetas de presentación");
    expect(markup).toContain("Tabloides");
    expect(markup).not.toContain("Impresión 3D");
    expect(markup).not.toContain("Mantenimiento de computador");
    expect(markup).not.toContain("Edición de video sencilla");
  });

  it("renders only tabloid pricing fields for the tabloid strategy", () => {
    const markup = renderToStaticMarkup(
      <ServicesPricingCalculator
        initialCategoryId={SERVICE_CATEGORY_IDS.printedProducts}
        initialServiceId={PRINTED_SERVICE_IDS.tabloids}
      />,
    );

    expect(markup).toContain("Tipo de tabloide");
    expect(markup).toContain("Cantidad de unidades");
    expect(markup).toContain(
      "Precio base negociado por unidad (opcional)",
    );
    expect(markup).toContain("Sin laminado");
    expect(markup).toContain("Laminado");
    expect(markup).toContain("La cantidad representa tabloides individuales");
    expect(markup).not.toContain("Acabado adhesivo");
    expect(markup).not.toContain("Cantidad en millares");
    expect(markup).not.toContain("Precio del primer minuto");
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

  it("applies the corrected double-face illuminated Panaflex regression result", () => {
    const calculation = calculateIlluminatedPanaflexSignPrice(
      50,
      50,
      1,
      PANAFLEX_PRICING_OPTION_IDS.illuminatedDoubleFace,
    );

    expect(calculation.normalPriceBeforeSmallMeasureAdjustment).toBe(133_750);
    expect(calculation.priceAfterSmallMeasureAdjustment).toBe(267_500);
    expect(calculation.commercialRoundedPrice).toBe(267_500);
  });

  it.each([
    [50, 50],
    [99, 101],
  ] as const)(
    "renders the small-measure notice for %s x %s cm Panaflex",
    (lengthCm, widthCm) => {
      const calculation = calculateIlluminatedPanaflexSignPrice(
        lengthCm,
        widthCm,
        1,
        PANAFLEX_PRICING_OPTION_IDS.illuminatedDoubleFace,
      );
      const markup = renderToStaticMarkup(
        <PanaflexPricingBreakdown
          calculation={calculation}
          optionName="Aviso luminoso doble cara"
        />,
      );

      expect(markup).toContain("Medida pequeña detectada.");
      expect(markup).toContain("Medida pequeña");
      expect(markup).toContain("multiplica por 2");
      expect(markup).toContain("×2");
    },
  );

  it("renders the complete small double-face price breakdown", () => {
    const calculation = calculateIlluminatedPanaflexSignPrice(
      50,
      50,
      1,
      PANAFLEX_PRICING_OPTION_IDS.illuminatedDoubleFace,
    );
    const markup = renderToStaticMarkup(
      <PanaflexPricingBreakdown
        calculation={calculation}
        optionName="Aviso luminoso doble cara"
      />,
    );

    expect(markup).toContain("Área calculada");
    expect(markup).toContain("Tarifa de estructura aplicada");
    expect(markup).toContain("Componente de una cara");
    expect(markup).toContain("Adicional de doble cara");
    expect(markup).toContain("Precio normal antes del ajuste");
    expect(markup).toContain('value="133750"');
    expect(markup).toContain("Precio después del ajuste");
    expect(markup).toContain('value="267500"');
    expect(markup).toContain("Precio antes del redondeo comercial");
    expect(markup).toContain("Precio comercial final");
  });

  it("renders 100 x 100 cm as standard without the small-measure notice", () => {
    const calculation = calculateIlluminatedPanaflexSignPrice(
      100,
      100,
      1,
      PANAFLEX_PRICING_OPTION_IDS.illuminatedSingleFace,
    );
    const markup = renderToStaticMarkup(
      <PanaflexPricingBreakdown
        calculation={calculation}
        optionName="Aviso luminoso una cara"
      />,
    );

    expect(markup).toContain("Medida estándar");
    expect(markup).toContain("No aplica");
    expect(markup).toContain('value="340000"');
    expect(markup).not.toContain("Medida pequeña detectada.");
    expect(markup).not.toContain("×2");
  });

  it("keeps other area products outside the small-measure multiplier", () => {
    const price = calculateAreaBasePrice(50, 50, 80_000, 1);

    expect(price).toBe(20_000);
    expect(roundUpToCop500(price)).toBe(20_000);
  });
});
