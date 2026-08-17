export const THREE_D_PRINTING_COLOR_MODE_IDS = {
  singleColor: "single-color",
  multicolor: "multicolor",
} as const;

export type ThreeDPrintingColorModeId =
  (typeof THREE_D_PRINTING_COLOR_MODE_IDS)[keyof typeof THREE_D_PRINTING_COLOR_MODE_IDS];

export type ThreeDPrintingColorModeConfig = Readonly<{
  id: ThreeDPrintingColorModeId;
  name: "Un color" | "Multicolor";
  commercialMultiplier: number;
}>;

export const THREE_D_PRINTING_COLOR_MODES: Readonly<
  Record<ThreeDPrintingColorModeId, ThreeDPrintingColorModeConfig>
> = Object.freeze({
  [THREE_D_PRINTING_COLOR_MODE_IDS.singleColor]: Object.freeze({
    id: THREE_D_PRINTING_COLOR_MODE_IDS.singleColor,
    name: "Un color",
    commercialMultiplier: 1,
  }),
  [THREE_D_PRINTING_COLOR_MODE_IDS.multicolor]: Object.freeze({
    id: THREE_D_PRINTING_COLOR_MODE_IDS.multicolor,
    name: "Multicolor",
    commercialMultiplier: 3,
  }),
});

export const THREE_D_PRINTING_COLOR_MODE_OPTIONS = Object.freeze(
  Object.values(THREE_D_PRINTING_COLOR_MODES),
);

export function isThreeDPrintingColorModeId(
  value: string,
): value is ThreeDPrintingColorModeId {
  return Object.hasOwn(THREE_D_PRINTING_COLOR_MODES, value);
}

export function getThreeDPrintingColorMode(
  colorModeId: string,
): ThreeDPrintingColorModeConfig {
  if (!isThreeDPrintingColorModeId(colorModeId)) {
    throw new RangeError("3D printing color mode must be valid.");
  }

  return THREE_D_PRINTING_COLOR_MODES[colorModeId];
}
