import {
  SECURITY_SYSTEM_PRESENTATION_IDS,
  SECURITY_SYSTEM_TYPE_OPTIONS,
  type SecuritySystemPresentationId,
} from "./security-system-options";
import type { SecuritySystemPricingResult } from "./security-system-pricing";
import type {
  QuotationLineDetail,
  QuotationLineDraft,
} from "./temporary-quotation";

const copFormatter = new Intl.NumberFormat("es-CO", {
  style: "currency",
  currency: "COP",
  currencyDisplay: "code",
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

function formatCop(value: number): string {
  return copFormatter.format(value);
}

function createCameraDetails(
  pricing: SecuritySystemPricingResult,
  includePrices: boolean,
): QuotationLineDetail[] {
  return pricing.cameraGroups.flatMap((group, index) => {
    if (
      !group.isComplete ||
      group.cameraReference === null ||
      group.quantity === null ||
      group.accessorySelectionName === null ||
      group.installationName === null ||
      group.cameraSubtotalCop === null ||
      group.installationSubtotalCop === null
    ) {
      return [];
    }

    const groupLabel = `Grupo ${index + 1}`;
    const cameraValue = `${groupLabel}: ${group.quantity} × ${group.cameraReference}, ${group.accessorySelectionName.toLowerCase()}`;
    const installationValue = `${groupLabel}: ${group.quantity} × ${group.installationName.toLowerCase()}`;

    return [
      {
        label: "Cámaras",
        value: includePrices
          ? `${cameraValue} — ${formatCop(group.cameraSubtotalCop)}`
          : cameraValue,
      },
      {
        label: "Instalación",
        value:
          includePrices && group.installationSubtotalCop > 0
            ? `${installationValue} — ${formatCop(group.installationSubtotalCop)}`
            : installationValue,
      },
    ];
  });
}

function createRecorderDetails(
  pricing: SecuritySystemPricingResult,
  includePrices: boolean,
): QuotationLineDetail[] {
  if (pricing.recorder.status === "not-applicable") return [];

  const details: QuotationLineDetail[] = [];
  if (
    pricing.recorder.status === "priced" &&
    pricing.recorder.reference !== null &&
    pricing.recorder.priceCop !== null
  ) {
    details.push({
      label: "Grabador",
      value: includePrices
        ? `${pricing.recorder.reference} — ${formatCop(pricing.recorder.priceCop)}`
        : pricing.recorder.reference,
    });
  }

  if (pricing.hardDrive.status === "none") {
    details.push({ label: "Disco duro", value: "Sin disco" });
  } else if (
    pricing.hardDrive.status === "priced" &&
    pricing.hardDrive.reference !== null &&
    pricing.hardDrive.capacityLabel !== null &&
    pricing.hardDrive.priceCop !== null
  ) {
    const value = `${pricing.hardDrive.reference} · ${pricing.hardDrive.capacityLabel}`;
    details.push({
      label: "Disco duro",
      value: includePrices
        ? `${value} — ${formatCop(pricing.hardDrive.priceCop)}`
        : value,
    });
  }

  if (pricing.recorderConfiguration.status === "included") {
    const value =
      "Incluida; configuración en celular incluida; acceso remoto no incluido";
    details.push({
      label: "Configuración DVR/NVR",
      value:
        includePrices && pricing.recorderConfiguration.priceCop !== null
          ? `${value} — ${formatCop(pricing.recorderConfiguration.priceCop)}`
          : value,
    });
  } else if (pricing.recorderConfiguration.status === "not-included") {
    details.push({
      label: "Configuración DVR/NVR",
      value: "No incluida",
    });
  }

  return details;
}

const OPTIONAL_COMPONENT_LABELS = Object.freeze({
  "poe-switch": "Switch PoE",
  "centralized-power-supply": "Fuente centralizada",
  "additional-accessory": "Accesorio adicional",
} as const);

function createOptionalComponentDetails(
  pricing: SecuritySystemPricingResult,
  includePrices: boolean,
): QuotationLineDetail[] {
  return pricing.optionalComponents.flatMap((component) => {
    if (
      component.status !== "priced" ||
      component.reference === null ||
      component.description === null ||
      component.quantity === null ||
      component.unitPriceCop === null ||
      component.subtotalCop === null
    ) {
      return [];
    }

    const description = `${component.quantity} × ${component.reference} · ${component.description}`;
    return [
      {
        label: OPTIONAL_COMPONENT_LABELS[component.componentType],
        value: includePrices
          ? `${description} — ${formatCop(component.unitPriceCop)} c/u · ${formatCop(component.subtotalCop)}`
          : description,
      },
    ];
  });
}

export function createSecuritySystemQuotationLineDraft(
  pricing: SecuritySystemPricingResult,
  presentationId: SecuritySystemPresentationId,
): QuotationLineDraft {
  if (!pricing.isPriceComplete || pricing.finalTotalCop === null) {
    throw new RangeError(
      "Security system quotation requires a complete published price.",
    );
  }

  const systemName = SECURITY_SYSTEM_TYPE_OPTIONS.find(
    (option) => option.id === pricing.systemTypeId,
  )!.name;
  const includePrices =
    presentationId === SECURITY_SYSTEM_PRESENTATION_IDS.itemized;
  const details: QuotationLineDetail[] = [
    { label: "Sistema", value: systemName },
    {
      label: "Presentación",
      value: includePrices ? "Desglosada" : "Agrupada",
    },
    ...createCameraDetails(pricing, includePrices),
    ...createRecorderDetails(pricing, includePrices),
    ...createOptionalComponentDetails(pricing, includePrices),
    {
      label: "Cableado",
      value: pricing.customerNotes[0],
    },
  ];

  return Object.freeze({
    source: "security-system",
    title: `Sistema de seguridad — ${systemName}`,
    quantity: 1,
    details: Object.freeze(
      details.map((detail) => Object.freeze({ ...detail })),
    ),
    lineTotal: pricing.finalTotalCop,
  });
}
