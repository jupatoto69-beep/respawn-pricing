export const SECURITY_SYSTEM_TYPE_IDS = {
  analog: "analog",
  ip: "ip",
  wifi: "wifi",
} as const;

export type SecuritySystemTypeId =
  (typeof SECURITY_SYSTEM_TYPE_IDS)[keyof typeof SECURITY_SYSTEM_TYPE_IDS];

export type SecuritySystemTypeOption = Readonly<{
  id: SecuritySystemTypeId;
  name: "Analógico" | "IP" | "Wi-Fi";
}>;

export const SECURITY_SYSTEM_TYPE_OPTIONS: readonly SecuritySystemTypeOption[] =
  Object.freeze([
    Object.freeze({ id: SECURITY_SYSTEM_TYPE_IDS.analog, name: "Analógico" }),
    Object.freeze({ id: SECURITY_SYSTEM_TYPE_IDS.ip, name: "IP" }),
    Object.freeze({ id: SECURITY_SYSTEM_TYPE_IDS.wifi, name: "Wi-Fi" }),
  ]);

export function isSecuritySystemTypeId(
  value: string,
): value is SecuritySystemTypeId {
  return SECURITY_SYSTEM_TYPE_OPTIONS.some((option) => option.id === value);
}

export const SECURITY_SYSTEM_INSTALLATION_TYPE_IDS = {
  none: "none",
  standard: "standard",
  high: "high",
  special: "special",
} as const;

export type SecuritySystemInstallationTypeId =
  (typeof SECURITY_SYSTEM_INSTALLATION_TYPE_IDS)[keyof typeof SECURITY_SYSTEM_INSTALLATION_TYPE_IDS];

export type SecuritySystemInstallationOption = Readonly<{
  id: SecuritySystemInstallationTypeId;
  name:
    | "Sin instalación"
    | "Estándar"
    | "Más de 4 metros"
    | "Especial / difícil";
  pricePerCameraCop: number;
}>;

export const SECURITY_SYSTEM_INSTALLATION_OPTIONS: Readonly<
  Record<SecuritySystemInstallationTypeId, SecuritySystemInstallationOption>
> = Object.freeze({
  [SECURITY_SYSTEM_INSTALLATION_TYPE_IDS.none]: Object.freeze({
    id: SECURITY_SYSTEM_INSTALLATION_TYPE_IDS.none,
    name: "Sin instalación",
    pricePerCameraCop: 0,
  }),
  [SECURITY_SYSTEM_INSTALLATION_TYPE_IDS.standard]: Object.freeze({
    id: SECURITY_SYSTEM_INSTALLATION_TYPE_IDS.standard,
    name: "Estándar",
    pricePerCameraCop: 60_000,
  }),
  [SECURITY_SYSTEM_INSTALLATION_TYPE_IDS.high]: Object.freeze({
    id: SECURITY_SYSTEM_INSTALLATION_TYPE_IDS.high,
    name: "Más de 4 metros",
    pricePerCameraCop: 80_000,
  }),
  [SECURITY_SYSTEM_INSTALLATION_TYPE_IDS.special]: Object.freeze({
    id: SECURITY_SYSTEM_INSTALLATION_TYPE_IDS.special,
    name: "Especial / difícil",
    pricePerCameraCop: 90_000,
  }),
});

export function isSecuritySystemInstallationTypeId(
  value: string,
): value is SecuritySystemInstallationTypeId {
  return Object.hasOwn(SECURITY_SYSTEM_INSTALLATION_OPTIONS, value);
}

export function getSecuritySystemInstallationOption(
  installationTypeId: string,
): SecuritySystemInstallationOption {
  if (!isSecuritySystemInstallationTypeId(installationTypeId)) {
    throw new RangeError("Security system installation type must be valid.");
  }

  return SECURITY_SYSTEM_INSTALLATION_OPTIONS[installationTypeId];
}

export const SECURITY_SYSTEM_PRESENTATION_IDS = {
  itemized: "itemized",
  bundled: "bundled",
} as const;

export type SecuritySystemPresentationId =
  (typeof SECURITY_SYSTEM_PRESENTATION_IDS)[keyof typeof SECURITY_SYSTEM_PRESENTATION_IDS];

export type SecuritySystemPresentationOption = Readonly<{
  id: SecuritySystemPresentationId;
  name: "Desglosada" | "Agrupada";
  description: string;
}>;

export const SECURITY_SYSTEM_PRESENTATION_OPTIONS: readonly SecuritySystemPresentationOption[] =
  Object.freeze([
    Object.freeze({
      id: SECURITY_SYSTEM_PRESENTATION_IDS.itemized,
      name: "Desglosada",
      description:
        "Muestra al cliente el precio individual de cada componente.",
    }),
    Object.freeze({
      id: SECURITY_SYSTEM_PRESENTATION_IDS.bundled,
      name: "Agrupada",
      description:
        "Muestra los componentes del sistema y únicamente el precio total.",
    }),
  ]);

export function isSecuritySystemPresentationId(
  value: string,
): value is SecuritySystemPresentationId {
  return SECURITY_SYSTEM_PRESENTATION_OPTIONS.some(
    (option) => option.id === value,
  );
}

export const SECURITY_SYSTEM_CUSTOM_PRICE_REASON_IDS = {
  negotiatedPrice: "negotiated-price",
  frequentCustomer: "frequent-customer",
  competition: "competition",
  catalogError: "catalog-error",
  other: "other",
} as const;

export type SecuritySystemCustomPriceReasonId =
  (typeof SECURITY_SYSTEM_CUSTOM_PRICE_REASON_IDS)[keyof typeof SECURITY_SYSTEM_CUSTOM_PRICE_REASON_IDS];

export type SecuritySystemCustomPriceReasonOption = Readonly<{
  id: SecuritySystemCustomPriceReasonId;
  name:
    | "Precio negociado"
    | "Cliente frecuente"
    | "Competencia"
    | "Error de catálogo"
    | "Otro";
  allowsFreeText: boolean;
}>;

export const SECURITY_SYSTEM_CUSTOM_PRICE_REASON_OPTIONS: readonly SecuritySystemCustomPriceReasonOption[] =
  Object.freeze([
    Object.freeze({
      id: SECURITY_SYSTEM_CUSTOM_PRICE_REASON_IDS.negotiatedPrice,
      name: "Precio negociado",
      allowsFreeText: false,
    }),
    Object.freeze({
      id: SECURITY_SYSTEM_CUSTOM_PRICE_REASON_IDS.frequentCustomer,
      name: "Cliente frecuente",
      allowsFreeText: false,
    }),
    Object.freeze({
      id: SECURITY_SYSTEM_CUSTOM_PRICE_REASON_IDS.competition,
      name: "Competencia",
      allowsFreeText: false,
    }),
    Object.freeze({
      id: SECURITY_SYSTEM_CUSTOM_PRICE_REASON_IDS.catalogError,
      name: "Error de catálogo",
      allowsFreeText: false,
    }),
    Object.freeze({
      id: SECURITY_SYSTEM_CUSTOM_PRICE_REASON_IDS.other,
      name: "Otro",
      allowsFreeText: true,
    }),
  ]);

export function isSecuritySystemCustomPriceReasonId(
  value: string,
): value is SecuritySystemCustomPriceReasonId {
  return SECURITY_SYSTEM_CUSTOM_PRICE_REASON_OPTIONS.some(
    (option) => option.id === value,
  );
}
