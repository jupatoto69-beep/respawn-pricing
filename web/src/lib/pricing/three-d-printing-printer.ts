import { THREE_D_PRINTING_COLOR_MODE_IDS } from "./three-d-printing-color-mode";
import type { ThreeDPrintingColorModeId } from "./three-d-printing-color-mode";

export const THREE_D_PRINTING_PRINTER_IDS = {
  ke: "ke",
  hi: "hi",
} as const;

export type ThreeDPrintingPrinterId =
  (typeof THREE_D_PRINTING_PRINTER_IDS)[keyof typeof THREE_D_PRINTING_PRINTER_IDS];

export type ThreeDPrintingPrinterConfig = Readonly<{
  id: ThreeDPrintingPrinterId;
  name: "KE" | "HI";
}>;

export const THREE_D_PRINTING_PRINTERS: Readonly<
  Record<ThreeDPrintingPrinterId, ThreeDPrintingPrinterConfig>
> = Object.freeze({
  [THREE_D_PRINTING_PRINTER_IDS.ke]: Object.freeze({
    id: THREE_D_PRINTING_PRINTER_IDS.ke,
    name: "KE",
  }),
  [THREE_D_PRINTING_PRINTER_IDS.hi]: Object.freeze({
    id: THREE_D_PRINTING_PRINTER_IDS.hi,
    name: "HI",
  }),
});

export const THREE_D_PRINTING_PRINTER_OPTIONS = Object.freeze(
  Object.values(THREE_D_PRINTING_PRINTERS),
);

export function isThreeDPrintingPrinterId(
  value: string,
): value is ThreeDPrintingPrinterId {
  return Object.hasOwn(THREE_D_PRINTING_PRINTERS, value);
}

export function getThreeDPrintingPrinter(
  printerId: string,
): ThreeDPrintingPrinterConfig {
  if (!isThreeDPrintingPrinterId(printerId)) {
    throw new RangeError("3D printing production printer must be valid.");
  }

  return THREE_D_PRINTING_PRINTERS[printerId];
}

export function isThreeDPrintingPrinterAllowed(
  colorModeId: ThreeDPrintingColorModeId,
  printerId: ThreeDPrintingPrinterId,
): boolean {
  return (
    colorModeId === THREE_D_PRINTING_COLOR_MODE_IDS.singleColor ||
    printerId === THREE_D_PRINTING_PRINTER_IDS.hi
  );
}

export function resolveThreeDPrintingProductionPrinter(
  colorModeId: ThreeDPrintingColorModeId,
  currentPrinterId: ThreeDPrintingPrinterId,
): ThreeDPrintingPrinterId {
  return colorModeId === THREE_D_PRINTING_COLOR_MODE_IDS.multicolor
    ? THREE_D_PRINTING_PRINTER_IDS.hi
    : currentPrinterId;
}
