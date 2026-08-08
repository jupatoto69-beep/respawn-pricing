const PDF_EXTENSION_PATTERN = /\.pdf$/iu;
const COMBINING_MARKS_PATTERN = /[\u0300-\u036f]/gu;
const WINDOWS_INVALID_FILENAME_PATTERN = /[<>:"/\\|?*\u0000-\u001f]/gu;
const NON_ALPHANUMERIC_PATTERN = /[^a-z0-9-]+/gu;
const REPEATED_HYPHENS_PATTERN = /-+/gu;
const EDGE_HYPHENS_PATTERN = /^-+|-+$/gu;

const DEFAULT_QUOTATION_FILENAME_BASENAME = "digital-respawn";

function createSafeBasename(customerName: string): string {
  const withoutExtension = customerName.trim().replace(PDF_EXTENSION_PATTERN, "");
  const normalized = withoutExtension
    .normalize("NFD")
    .replace(COMBINING_MARKS_PATTERN, "")
    .toLocaleLowerCase("es-CO")
    .replace(WINDOWS_INVALID_FILENAME_PATTERN, "-")
    .replace(/\s+/gu, "-")
    .replace(NON_ALPHANUMERIC_PATTERN, "-")
    .replace(REPEATED_HYPHENS_PATTERN, "-")
    .replace(EDGE_HYPHENS_PATTERN, "");

  return normalized.length > 0
    ? normalized
    : DEFAULT_QUOTATION_FILENAME_BASENAME;
}

export function createQuotationPdfFilename(customerName: string): string {
  return `cotizacion-${createSafeBasename(customerName)}.pdf`;
}
