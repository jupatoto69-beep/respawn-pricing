export const THREE_D_PRINTING_SUBMODE_IDS = {
  precise: "precise",
  quick: "quick",
} as const;

export type ThreeDPrintingSubmodeId =
  (typeof THREE_D_PRINTING_SUBMODE_IDS)[keyof typeof THREE_D_PRINTING_SUBMODE_IDS];

export const THREE_D_PRINTING_SUBMODE_OPTIONS = Object.freeze([
  Object.freeze({
    id: THREE_D_PRINTING_SUBMODE_IDS.precise,
    name: "Cotización precisa",
    description: "Usa gramos y tiempo reales obtenidos del laminador.",
  }),
  Object.freeze({
    id: THREE_D_PRINTING_SUBMODE_IDS.quick,
    name: "Estimación rápida",
    description: "Registra datos preliminares antes de recibir el archivo 3D.",
  }),
]);

export function isThreeDPrintingSubmodeId(
  value: string,
): value is ThreeDPrintingSubmodeId {
  return THREE_D_PRINTING_SUBMODE_OPTIONS.some((option) => option.id === value);
}
