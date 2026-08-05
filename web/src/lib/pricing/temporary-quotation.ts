export type QuotationLineSource = "area-product" | "service";

export type QuotationLineDetail = Readonly<{
  label: string;
  value: string;
}>;

export type QuotationLineDraft = Readonly<{
  source: QuotationLineSource;
  title: string;
  quantity: number;
  details: readonly QuotationLineDetail[];
  lineTotal: number;
}>;

export type QuotationLine = QuotationLineDraft &
  Readonly<{
    id: string;
  }>;

export type TemporaryQuotationState = Readonly<{
  lines: readonly QuotationLine[];
  nextLineSequence: number;
}>;

function freezeState(
  lines: readonly QuotationLine[],
  nextLineSequence: number,
): TemporaryQuotationState {
  return Object.freeze({
    lines: Object.freeze([...lines]),
    nextLineSequence,
  });
}

function assertValidLineTotal(lineTotal: number): void {
  if (!Number.isFinite(lineTotal)) {
    throw new RangeError("Quotation line total must be finite.");
  }

  if (lineTotal < 0) {
    throw new RangeError("Quotation line total must not be negative.");
  }

  if (!Number.isSafeInteger(lineTotal)) {
    throw new RangeError("Quotation line total must be a safe integer.");
  }
}

function addSafeTotals(currentTotal: number, lineTotal: number): number {
  if (lineTotal > Number.MAX_SAFE_INTEGER - currentTotal) {
    throw new RangeError("Quotation total exceeds the safe integer range.");
  }

  return currentTotal + lineTotal;
}

function copyDetails(
  details: readonly QuotationLineDetail[],
): readonly QuotationLineDetail[] {
  return Object.freeze(
    details.map((detail) =>
      Object.freeze({
        label: detail.label,
        value: detail.value,
      }),
    ),
  );
}

export function createEmptyQuotation(): TemporaryQuotationState {
  return freezeState([], 1);
}

export function calculateQuotationTotal(
  quotation: TemporaryQuotationState,
): number {
  return quotation.lines.reduce((total, line) => {
    assertValidLineTotal(line.lineTotal);
    return addSafeTotals(total, line.lineTotal);
  }, 0);
}

export function addQuotationLine(
  quotation: TemporaryQuotationState,
  draft: QuotationLineDraft,
): TemporaryQuotationState {
  assertValidLineTotal(draft.lineTotal);
  addSafeTotals(calculateQuotationTotal(quotation), draft.lineTotal);

  if (
    !Number.isSafeInteger(quotation.nextLineSequence) ||
    quotation.nextLineSequence < 1 ||
    quotation.nextLineSequence === Number.MAX_SAFE_INTEGER
  ) {
    throw new RangeError("Quotation line sequence is outside the safe range.");
  }

  const line: QuotationLine = Object.freeze({
    id: `quotation-line-${quotation.nextLineSequence}`,
    source: draft.source,
    title: draft.title,
    quantity: draft.quantity,
    details: copyDetails(draft.details),
    lineTotal: draft.lineTotal,
  });

  return freezeState(
    [...quotation.lines, line],
    quotation.nextLineSequence + 1,
  );
}

export function removeQuotationLine(
  quotation: TemporaryQuotationState,
  lineId: string,
): TemporaryQuotationState {
  if (!quotation.lines.some((line) => line.id === lineId)) {
    return quotation;
  }

  return freezeState(
    quotation.lines.filter((line) => line.id !== lineId),
    quotation.nextLineSequence,
  );
}

export function clearQuotation(
  quotation: TemporaryQuotationState,
): TemporaryQuotationState {
  if (quotation.lines.length === 0) {
    return quotation;
  }

  return freezeState([], quotation.nextLineSequence);
}
