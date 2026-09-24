import type { QuotationLineDetail } from "@/lib/pricing/temporary-quotation";

export const CUSTOMER_SAFE_LINE_DETAIL_LABELS = Object.freeze([
  "Producto",
  "Servicio",
  "Categoría",
  "Descripción",
  "Configuración",
  "Variante",
  "Color",
  "Dimensiones",
  "Área por unidad",
  "Estructura",
  "Opción de Panaflex",
  "Clasificación de medida",
  "Opción seleccionada",
  "Paquete",
  "Unidad",
  "Cantidad de programas",
  "Alcance",
  "Duración ingresada",
  "Minutos facturables",
  "Tipo",
  "Cantidad en millares",
  "Acabado adhesivo",
  "Laminado",
  "Material",
  "Gramos por unidad",
  "Tiempo de impresión por unidad",
  "Modelado",
  "Tipo de impresión",
  "Impresora",
  "Tamaño aproximado",
  "Producción",
  "Condición",
  "Sistema",
  "Presentación",
  "Cámaras",
  "Instalación",
  "Grabador",
  "Disco duro",
  "Configuración DVR/NVR",
  "Switch PoE",
  "Fuente centralizada",
  "Accesorio adicional",
  "Cableado",
] as const);

const customerSafeLineDetailLabelSet = new Set<string>(
  CUSTOMER_SAFE_LINE_DETAIL_LABELS,
);

export function isCustomerSafeLineDetail(
  detail: QuotationLineDetail,
): boolean {
  return (
    customerSafeLineDetailLabelSet.has(detail.label) &&
    detail.value.trim().length > 0
  );
}

export function createCustomerSafeLineDetails(
  details: readonly QuotationLineDetail[],
): readonly QuotationLineDetail[] {
  return Object.freeze(
    details.filter(isCustomerSafeLineDetail).map((detail) =>
      Object.freeze({
        label: detail.label,
        value: detail.value,
      }),
    ),
  );
}
