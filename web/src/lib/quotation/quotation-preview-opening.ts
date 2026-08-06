import {
  getFirstTemporaryQuotationDetailErrorField,
  validateTemporaryQuotationDetails,
  type TemporaryQuotationDetailErrors,
} from "@/lib/pricing/temporary-quotation-details-validation";
import type {
  TemporaryQuotationState,
  TemporaryQuotationTextDetailField,
} from "@/lib/pricing/temporary-quotation";

export type QuotationPreviewOpeningEvaluation = Readonly<{
  canOpen: boolean;
  errors: TemporaryQuotationDetailErrors;
  firstInvalidField: TemporaryQuotationTextDetailField | null;
}>;

export function evaluateQuotationPreviewOpening(
  quotation: TemporaryQuotationState,
): QuotationPreviewOpeningEvaluation {
  const errors = validateTemporaryQuotationDetails(quotation.details);
  const firstInvalidField =
    getFirstTemporaryQuotationDetailErrorField(errors) ?? null;

  return Object.freeze({
    canOpen: quotation.lines.length > 0 && firstInvalidField === null,
    errors,
    firstInvalidField,
  });
}
