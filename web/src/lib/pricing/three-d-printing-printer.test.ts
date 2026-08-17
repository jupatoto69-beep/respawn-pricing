import { describe, expect, it } from "vitest";

import { THREE_D_PRINTING_COLOR_MODE_IDS } from "./three-d-printing-color-mode";
import {
  getThreeDPrintingPrinter,
  isThreeDPrintingPrinterAllowed,
  resolveThreeDPrintingProductionPrinter,
  THREE_D_PRINTING_PRINTER_IDS,
  THREE_D_PRINTING_PRINTER_OPTIONS,
} from "./three-d-printing-printer";

describe("3D printing production printers", () => {
  it("offers the typed KE and HI production printers", () => {
    expect(THREE_D_PRINTING_PRINTER_OPTIONS).toEqual([
      { id: THREE_D_PRINTING_PRINTER_IDS.ke, name: "KE" },
      { id: THREE_D_PRINTING_PRINTER_IDS.hi, name: "HI" },
    ]);
  });

  it("allows KE or HI for one-color production", () => {
    expect(
      isThreeDPrintingPrinterAllowed(
        THREE_D_PRINTING_COLOR_MODE_IDS.singleColor,
        THREE_D_PRINTING_PRINTER_IDS.ke,
      ),
    ).toBe(true);
    expect(
      isThreeDPrintingPrinterAllowed(
        THREE_D_PRINTING_COLOR_MODE_IDS.singleColor,
        THREE_D_PRINTING_PRINTER_IDS.hi,
      ),
    ).toBe(true);
  });

  it("requires and resolves HI for multicolor production", () => {
    expect(
      isThreeDPrintingPrinterAllowed(
        THREE_D_PRINTING_COLOR_MODE_IDS.multicolor,
        THREE_D_PRINTING_PRINTER_IDS.ke,
      ),
    ).toBe(false);
    expect(
      isThreeDPrintingPrinterAllowed(
        THREE_D_PRINTING_COLOR_MODE_IDS.multicolor,
        THREE_D_PRINTING_PRINTER_IDS.hi,
      ),
    ).toBe(true);
    expect(
      resolveThreeDPrintingProductionPrinter(
        THREE_D_PRINTING_COLOR_MODE_IDS.multicolor,
        THREE_D_PRINTING_PRINTER_IDS.ke,
      ),
    ).toBe(THREE_D_PRINTING_PRINTER_IDS.hi);
  });

  it("does not attach dimensions or pricing values to printer configuration", () => {
    const serialized = JSON.stringify(
      getThreeDPrintingPrinter(THREE_D_PRINTING_PRINTER_IDS.ke),
    ).toLocaleLowerCase("es-CO");

    for (const forbidden of ["width", "depth", "height", "power", "price"]) {
      expect(serialized).not.toContain(forbidden);
    }
  });
});
