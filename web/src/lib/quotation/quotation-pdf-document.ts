import type { jsPDF as JsPdfDocument } from "jspdf";

import type {
  QuotationPreviewField,
  QuotationPreviewLine,
  QuotationPreviewViewModel,
} from "./quotation-preview-view-model";
import {
  fitProportionally,
  loadLocalQuotationPdfLogo,
  type QuotationPdfLogo,
  type QuotationPdfLogoLoader,
} from "./quotation-pdf-logo";

export type QuotationPdfGenerator = (
  preview: QuotationPreviewViewModel,
) => Promise<Blob>;

export type QuotationPdfGenerationOptions = Readonly<{
  loadLogo?: QuotationPdfLogoLoader;
}>;

const PAGE_WIDTH_MM = 210;
const PAGE_HEIGHT_MM = 297;
const PAGE_MARGIN_MM = 16;
const PAGE_CONTENT_BOTTOM_MM = 278;
const BODY_WIDTH_MM = PAGE_WIDTH_MM - PAGE_MARGIN_MM * 2;
const GRID_COLUMN_GAP_MM = 10;
const GRID_COLUMN_WIDTH_MM =
  (BODY_WIDTH_MM - GRID_COLUMN_GAP_MM) / 2;
const GRID_ROW_GAP_MM = 2.5;
const CONTINUATION_CONTENT_TOP_MM = 27;

const COLORS = Object.freeze({
  ink: "#172235",
  muted: "#5c6878",
  blue: "#185cae",
  darkBlue: "#12345f",
  border: "#ccd8e7",
});

type TextStyle = Readonly<{
  fontSize: number;
  fontStyle?: "normal" | "bold";
  color?: string;
  lineHeight: number;
}>;

type TextAlignment = "left" | "right";

const FIELD_LABEL_STYLE = Object.freeze({
  fontSize: 7.5,
  fontStyle: "bold" as const,
  color: COLORS.muted,
  lineHeight: 3.8,
});

const FIELD_VALUE_STYLE = Object.freeze({
  fontSize: 9.5,
  color: COLORS.ink,
  lineHeight: 4.5,
});

const LINE_TITLE_STYLE = Object.freeze({
  fontSize: 11,
  fontStyle: "bold" as const,
  color: COLORS.ink,
  lineHeight: 5.2,
});

const LINE_TOTAL_STYLE = Object.freeze({
  fontSize: 11,
  fontStyle: "bold" as const,
  color: COLORS.blue,
  lineHeight: 5.2,
});

type FieldGridRow = Readonly<{
  fields: readonly QuotationPreviewField[];
  widths: readonly number[];
  height: number;
}>;

function splitTextPreservingLineBreaks(
  document: JsPdfDocument,
  text: string,
  width: number,
): readonly string[] {
  return text.replace(/\r\n?/gu, "\n").split("\n").flatMap((paragraph) => {
    if (paragraph.length === 0) {
      return [""];
    }

    return document.splitTextToSize(paragraph, width) as string[];
  });
}

function setTextStyle(
  document: JsPdfDocument,
  style: TextStyle,
): void {
  document.setFont("helvetica", style.fontStyle ?? "normal");
  document.setFontSize(style.fontSize);
  document.setTextColor(style.color ?? COLORS.ink);
}

class PdfFlowLayout {
  private y = PAGE_MARGIN_MM;
  private continuationHeading: string;

  constructor(
    private readonly document: JsPdfDocument,
    businessName: string,
  ) {
    this.continuationHeading = businessName;
  }

  get cursorY(): number {
    return this.y;
  }

  set cursorY(value: number) {
    this.y = value;
  }

  get availableHeight(): number {
    return PAGE_CONTENT_BOTTOM_MM - this.y;
  }

  setContinuationHeading(value: string): void {
    this.continuationHeading = value;
  }

  addPage(): void {
    this.document.addPage("a4", "portrait");
    this.y = PAGE_MARGIN_MM;
    setTextStyle(this.document, {
      fontSize: 8.5,
      fontStyle: "bold",
      color: COLORS.blue,
      lineHeight: 4,
    });
    this.document.text(this.continuationHeading, PAGE_MARGIN_MM, this.y);
    this.y += 4;
    this.document.setDrawColor(COLORS.border);
    this.document.line(
      PAGE_MARGIN_MM,
      this.y,
      PAGE_WIDTH_MM - PAGE_MARGIN_MM,
      this.y,
    );
    this.y = CONTINUATION_CONTENT_TOP_MM;
  }

  ensureSpace(height: number): boolean {
    if (height <= this.availableHeight) {
      return false;
    }

    this.addPage();
    return true;
  }

  drawWrappedText(
    text: string,
    x: number,
    width: number,
    style: TextStyle,
    onPageBreak?: () => void,
  ): void {
    setTextStyle(this.document, style);
    const lines = splitTextPreservingLineBreaks(this.document, text, width);

    for (const line of lines) {
      if (this.ensureSpace(style.lineHeight)) {
        onPageBreak?.();
        setTextStyle(this.document, style);
      }

      if (line.length > 0) {
        this.document.text(line, x, this.y);
      }

      this.y += style.lineHeight;
    }
  }

  drawWrappedTextAt(
    text: string,
    x: number,
    y: number,
    width: number,
    style: TextStyle,
    align: TextAlignment = "left",
  ): number {
    setTextStyle(this.document, style);
    const lines = splitTextPreservingLineBreaks(this.document, text, width);
    const textX = align === "right" ? x + width : x;

    lines.forEach((line, index) => {
      if (line.length > 0) {
        this.document.text(
          line,
          textX,
          y + index * style.lineHeight,
          { align },
        );
      }
    });

    return lines.length * style.lineHeight;
  }

  measureWrappedText(
    text: string,
    width: number,
    style: TextStyle,
  ): number {
    setTextStyle(this.document, style);
    return (
      splitTextPreservingLineBreaks(this.document, text, width).length *
      style.lineHeight
    );
  }
}

async function tryLoadLogo(
  preview: QuotationPreviewViewModel,
  loader: QuotationPdfLogoLoader,
): Promise<QuotationPdfLogo | null> {
  if (preview.logoOnLightPath === null) {
    return null;
  }

  try {
    return await loader(preview.logoOnLightPath);
  } catch {
    return null;
  }
}

function tryDrawFirstPageLogo(
  document: JsPdfDocument,
  logo: QuotationPdfLogo | null,
  y: number,
): Readonly<{ drawn: boolean; height: number }> {
  if (logo === null) {
    return Object.freeze({ drawn: false, height: 0 });
  }

  try {
    const fitted = fitProportionally(
      { width: logo.width, height: logo.height },
      { width: 62, height: 18 },
    );
    document.addImage(
      new Uint8Array(logo.bytes),
      logo.format,
      PAGE_MARGIN_MM,
      y,
      fitted.width,
      fitted.height,
      undefined,
      "FAST",
    );
    return Object.freeze({ drawn: true, height: fitted.height });
  } catch {
    return Object.freeze({ drawn: false, height: 0 });
  }
}

function measureField(
  flow: PdfFlowLayout,
  field: QuotationPreviewField,
  width: number,
): number {
  return (
    flow.measureWrappedText(field.label, width, FIELD_LABEL_STYLE) +
    flow.measureWrappedText(field.value, width, FIELD_VALUE_STYLE) +
    1.5
  );
}

function drawFieldAt(
  flow: PdfFlowLayout,
  field: QuotationPreviewField,
  x: number,
  y: number,
  width: number,
): number {
  const labelHeight = flow.drawWrappedTextAt(
    field.label,
    x,
    y,
    width,
    FIELD_LABEL_STYLE,
  );
  const valueHeight = flow.drawWrappedTextAt(
    field.value,
    x,
    y + labelHeight,
    width,
    FIELD_VALUE_STYLE,
  );

  return labelHeight + valueHeight + 1.5;
}

function fieldNeedsFullWidth(
  flow: PdfFlowLayout,
  field: QuotationPreviewField,
  preferredFullWidthLabels: ReadonlySet<string>,
): boolean {
  if (preferredFullWidthLabels.has(field.label)) {
    return true;
  }

  return (
    measureField(flow, field, GRID_COLUMN_WIDTH_MM) >
    measureField(flow, field, BODY_WIDTH_MM) + 0.1
  );
}

function createFieldGridRows(
  flow: PdfFlowLayout,
  fields: readonly QuotationPreviewField[],
  preferredFullWidthLabels: ReadonlySet<string>,
): readonly FieldGridRow[] {
  const rows: FieldGridRow[] = [];

  for (let index = 0; index < fields.length;) {
    const field = fields[index];
    const fieldIsFullWidth = fieldNeedsFullWidth(
      flow,
      field,
      preferredFullWidthLabels,
    );

    if (fieldIsFullWidth) {
      rows.push(Object.freeze({
        fields: Object.freeze([field]),
        widths: Object.freeze([BODY_WIDTH_MM]),
        height: measureField(flow, field, BODY_WIDTH_MM),
      }));
      index += 1;
      continue;
    }

    const nextField = fields[index + 1];
    const canPairWithNext =
      nextField !== undefined &&
      !fieldNeedsFullWidth(flow, nextField, preferredFullWidthLabels);
    const rowFields = canPairWithNext ? [field, nextField] : [field];
    const rowWidths = rowFields.map(() => GRID_COLUMN_WIDTH_MM);

    rows.push(Object.freeze({
      fields: Object.freeze(rowFields),
      widths: Object.freeze(rowWidths),
      height: Math.max(
        ...rowFields.map((rowField) =>
          measureField(flow, rowField, GRID_COLUMN_WIDTH_MM),
        ),
      ),
    }));
    index += rowFields.length;
  }

  return Object.freeze(rows);
}

function measureFieldGrid(
  rows: readonly FieldGridRow[],
): number {
  if (rows.length === 0) {
    return 0;
  }

  return (
    rows.reduce((height, row) => height + row.height, 0) +
    (rows.length - 1) * GRID_ROW_GAP_MM
  );
}

function drawFlowingField(
  flow: PdfFlowLayout,
  field: QuotationPreviewField,
  onPageBreak?: () => void,
): void {
  const firstValueLineHeight = FIELD_VALUE_STYLE.lineHeight;
  const labelHeight = flow.measureWrappedText(
    field.label,
    BODY_WIDTH_MM,
    FIELD_LABEL_STYLE,
  );

  if (flow.ensureSpace(labelHeight + firstValueLineHeight)) {
    onPageBreak?.();
  }
  flow.drawWrappedText(
    field.label,
    PAGE_MARGIN_MM,
    BODY_WIDTH_MM,
    FIELD_LABEL_STYLE,
    onPageBreak,
  );
  flow.drawWrappedText(
    field.value,
    PAGE_MARGIN_MM,
    BODY_WIDTH_MM,
    FIELD_VALUE_STYLE,
    onPageBreak,
  );
  flow.cursorY += 1.5;
}

function drawFieldGrid(
  flow: PdfFlowLayout,
  fields: readonly QuotationPreviewField[],
  options: Readonly<{
    preferredFullWidthLabels?: ReadonlySet<string>;
    onPageBreak?: () => void;
  }> = {},
): void {
  const rows = createFieldGridRows(
    flow,
    fields,
    options.preferredFullWidthLabels ?? new Set<string>(),
  );
  const maximumRowHeight =
    PAGE_CONTENT_BOTTOM_MM - CONTINUATION_CONTENT_TOP_MM;

  rows.forEach((row, rowIndex) => {
    if (row.height > maximumRowHeight) {
      drawFlowingField(flow, row.fields[0], options.onPageBreak);
    } else {
      if (flow.ensureSpace(row.height)) {
        options.onPageBreak?.();
      }

      const rowY = flow.cursorY;
      row.fields.forEach((field, fieldIndex) => {
        const x =
          PAGE_MARGIN_MM +
          fieldIndex * (GRID_COLUMN_WIDTH_MM + GRID_COLUMN_GAP_MM);
        drawFieldAt(flow, field, x, rowY, row.widths[fieldIndex]);
      });
      flow.cursorY += row.height;
    }

    if (rowIndex < rows.length - 1) {
      flow.cursorY += GRID_ROW_GAP_MM;
    }
  });

}

function drawFirstPageHeader(
  document: JsPdfDocument,
  flow: PdfFlowLayout,
  preview: QuotationPreviewViewModel,
  logo: QuotationPdfLogo | null,
): void {
  const headerTop = flow.cursorY;
  const logoResult = tryDrawFirstPageLogo(document, logo, headerTop);
  let identityBottom = headerTop + logoResult.height;

  if (!logoResult.drawn) {
    const fallbackY = headerTop + 6;
    const fallbackHeight = flow.drawWrappedTextAt(
      preview.businessName,
      PAGE_MARGIN_MM,
      fallbackY,
      88,
      {
        fontSize: 12,
        fontStyle: "bold",
        color: COLORS.blue,
        lineHeight: 5.5,
      },
    );
    identityBottom = fallbackY + fallbackHeight;
  }

  flow.setContinuationHeading(
    logoResult.drawn ? "Cotización" : preview.businessName,
  );

  const titleWidth = 70;
  const titleX = PAGE_WIDTH_MM - PAGE_MARGIN_MM - titleWidth;
  const titleY = headerTop + 9;
  const titleHeight = flow.drawWrappedTextAt(
    "Cotización",
    titleX,
    titleY,
    titleWidth,
    {
      fontSize: 24,
      fontStyle: "bold",
      color: COLORS.ink,
      lineHeight: 10,
    },
    "right",
  );

  flow.cursorY = Math.max(identityBottom, titleY + titleHeight) + 4;

  const headerFields = [
    ...preview.quotationFields,
    ...preview.businessFields,
  ];

  if (headerFields.length > 0) {
    drawFieldGrid(flow, headerFields);
    flow.cursorY += 1;
  }

  document.setDrawColor(COLORS.blue);
  document.setLineWidth(0.8);
  document.line(
    PAGE_MARGIN_MM,
    flow.cursorY,
    PAGE_WIDTH_MM - PAGE_MARGIN_MM,
    flow.cursorY,
  );
  flow.cursorY += 8;
}

function drawSectionHeading(
  flow: PdfFlowLayout,
  title: string,
  minimumFollowingHeight = 8,
): void {
  flow.ensureSpace(7 + minimumFollowingHeight);
  flow.drawWrappedText(title, PAGE_MARGIN_MM, BODY_WIDTH_MM, {
    fontSize: 12,
    fontStyle: "bold",
    color: COLORS.darkBlue,
    lineHeight: 5.5,
  });
  flow.cursorY += 1.5;
}

function createLineContinuation(
  flow: PdfFlowLayout,
  lineNumber: number,
): () => void {
  return () => {
    flow.drawWrappedText(
      `Línea ${lineNumber} (continuación)`,
      PAGE_MARGIN_MM,
      BODY_WIDTH_MM,
      { fontSize: 8, fontStyle: "bold", color: COLORS.blue, lineHeight: 5 },
    );
    flow.cursorY += 1.5;
  };
}

function createLineFields(
  line: QuotationPreviewLine,
): readonly QuotationPreviewField[] {
  return Object.freeze([
    ...line.details,
    Object.freeze({ label: "Cantidad", value: String(line.quantity) }),
  ]);
}

const LINE_FULL_WIDTH_LABELS = new Set(["Condición"]);

function measureLineBlock(
  flow: PdfFlowLayout,
  line: QuotationPreviewLine,
): number {
  const titleWidth = BODY_WIDTH_MM - 52;
  const titleHeight = flow.measureWrappedText(
    line.title,
    titleWidth,
    LINE_TITLE_STYLE,
  );
  const totalHeight = flow.measureWrappedText(
    line.formattedLineTotal,
    46,
    LINE_TOTAL_STYLE,
  );
  const rows = createFieldGridRows(
    flow,
    createLineFields(line),
    LINE_FULL_WIDTH_LABELS,
  );

  return (
    4 +
    Math.max(titleHeight, totalHeight) +
    2 +
    measureFieldGrid(rows) +
    7
  );
}

function drawQuotationLine(
  document: JsPdfDocument,
  flow: PdfFlowLayout,
  line: QuotationPreviewLine,
  lineNumber: number,
): void {
  const measuredHeight = measureLineBlock(flow, line);
  const maximumWholeBlockHeight =
    PAGE_CONTENT_BOTTOM_MM - CONTINUATION_CONTENT_TOP_MM;

  if (measuredHeight <= maximumWholeBlockHeight) {
    flow.ensureSpace(measuredHeight);
  } else {
    const titleHeight = flow.measureWrappedText(
      line.title,
      BODY_WIDTH_MM - 52,
      LINE_TITLE_STYLE,
    );
    const totalHeight = flow.measureWrappedText(
      line.formattedLineTotal,
      46,
      LINE_TOTAL_STYLE,
    );
    flow.ensureSpace(4 + Math.max(titleHeight, totalHeight) + 14);
  }

  flow.drawWrappedText(`Línea ${lineNumber}`, PAGE_MARGIN_MM, BODY_WIDTH_MM, {
    fontSize: 7.5,
    fontStyle: "bold",
    color: COLORS.blue,
    lineHeight: 4,
  });

  const titleWidth = BODY_WIDTH_MM - 52;
  const totalWidth = 46;
  const headingY = flow.cursorY;
  const titleHeight = flow.drawWrappedTextAt(
    line.title,
    PAGE_MARGIN_MM,
    headingY,
    titleWidth,
    LINE_TITLE_STYLE,
  );
  const totalHeight = flow.drawWrappedTextAt(
    line.formattedLineTotal,
    PAGE_WIDTH_MM - PAGE_MARGIN_MM - totalWidth,
    headingY,
    totalWidth,
    LINE_TOTAL_STYLE,
    "right",
  );
  flow.cursorY += Math.max(titleHeight, totalHeight) + 2;

  drawFieldGrid(flow, createLineFields(line), {
    preferredFullWidthLabels: LINE_FULL_WIDTH_LABELS,
    onPageBreak: createLineContinuation(flow, lineNumber),
  });

  if (flow.availableHeight >= 3) {
    flow.cursorY += 2;
    document.setDrawColor(COLORS.border);
    document.setLineWidth(0.25);
    document.line(
      PAGE_MARGIN_MM,
      flow.cursorY,
      PAGE_WIDTH_MM - PAGE_MARGIN_MM,
      flow.cursorY,
    );
    flow.cursorY += 5;
  } else {
    flow.cursorY = PAGE_CONTENT_BOTTOM_MM;
  }
}

function drawGrandTotal(
  document: JsPdfDocument,
  flow: PdfFlowLayout,
  preview: QuotationPreviewViewModel,
): void {
  flow.ensureSpace(19);
  document.setFillColor(COLORS.darkBlue);
  document.roundedRect(
    PAGE_MARGIN_MM,
    flow.cursorY,
    BODY_WIDTH_MM,
    15,
    2,
    2,
    "F",
  );
  setTextStyle(document, {
    fontSize: 10,
    fontStyle: "bold",
    color: "#ffffff",
    lineHeight: 5,
  });
  document.text("TOTAL", PAGE_MARGIN_MM + 5, flow.cursorY + 9.5);
  document.text(
    preview.formattedTotal,
    PAGE_WIDTH_MM - PAGE_MARGIN_MM - 5,
    flow.cursorY + 9.5,
    { align: "right" },
  );
  flow.cursorY += 20;
}

function drawNotes(flow: PdfFlowLayout, notes: string): void {
  drawSectionHeading(flow, "Observaciones", 6);
  flow.drawWrappedText(notes, PAGE_MARGIN_MM, BODY_WIDTH_MM, {
    fontSize: 9.5,
    color: COLORS.ink,
    lineHeight: 4.7,
  });
}

function drawPageNumbers(document: JsPdfDocument): void {
  const pageCount = document.getNumberOfPages();

  if (pageCount <= 1) {
    return;
  }

  for (let pageNumber = 1; pageNumber <= pageCount; pageNumber += 1) {
    document.setPage(pageNumber);
    setTextStyle(document, {
      fontSize: 8,
      color: COLORS.muted,
      lineHeight: 4,
    });
    document.text(
      `Página ${pageNumber} de ${pageCount}`,
      PAGE_WIDTH_MM - PAGE_MARGIN_MM,
      PAGE_HEIGHT_MM - 7,
      { align: "right" },
    );
  }
}

export async function generateQuotationPdfBlob(
  preview: QuotationPreviewViewModel,
  options: QuotationPdfGenerationOptions = {},
): Promise<Blob> {
  const [{ jsPDF }, logo] = await Promise.all([
    import("jspdf"),
    tryLoadLogo(preview, options.loadLogo ?? loadLocalQuotationPdfLogo),
  ]);
  const document = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
    compress: true,
    putOnlyUsedFonts: true,
    precision: 3,
  });
  const flow = new PdfFlowLayout(document, preview.businessName);

  document.setLanguage("es-CO");
  drawFirstPageHeader(document, flow, preview, logo);

  if (preview.customerFields.length > 0) {
    drawSectionHeading(flow, "Datos del cliente", 10);
    drawFieldGrid(flow, preview.customerFields, {
      preferredFullWidthLabels: new Set(["Nombre o empresa"]),
    });
    flow.cursorY += 3;
  }

  drawSectionHeading(flow, "Detalle de la cotización", 18);
  preview.lines.forEach((line, index) => {
    drawQuotationLine(document, flow, line, index + 1);
  });
  drawGrandTotal(document, flow, preview);

  if (preview.notes !== null) {
    drawNotes(flow, preview.notes);
  }

  drawPageNumbers(document);

  const bytes = new Uint8Array(document.output("arraybuffer"));
  return new Blob([bytes], { type: "application/pdf" });
}
