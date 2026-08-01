import { describe, expect, it } from "vitest";

import {
  DEFAULT_PANAFLEX_PRICING_OPTION_ID,
  PANAFLEX_PRICING_OPTION_IDS,
  usesIlluminatedPanaflexPricing,
} from "./panaflex-pricing-options";
import { changePanaflexPricingSelection } from "./panaflex-pricing-selection";

describe("changePanaflexPricingSelection", () => {
  it("selects material only by default when changing to Panaflex", () => {
    expect(
      changePanaflexPricingSelection("printed-vinyl", "panaflex", null),
    ).toBe(DEFAULT_PANAFLEX_PRICING_OPTION_ID);
  });

  it("clears the Panaflex option when changing to another product", () => {
    expect(
      changePanaflexPricingSelection(
        "panaflex",
        "cut-vinyl",
        PANAFLEX_PRICING_OPTION_IDS.illuminatedDoubleFace,
      ),
    ).toBeNull();
  });

  it("starts again with material only when returning to Panaflex", () => {
    const clearedOption = changePanaflexPricingSelection(
      "panaflex",
      "banner",
      PANAFLEX_PRICING_OPTION_IDS.illuminatedSingleFace,
    );

    expect(
      changePanaflexPricingSelection("banner", "panaflex", clearedOption),
    ).toBe(DEFAULT_PANAFLEX_PRICING_OPTION_ID);
  });

  it("preserves the option while Panaflex remains selected", () => {
    expect(
      changePanaflexPricingSelection(
        "panaflex",
        "panaflex",
        PANAFLEX_PRICING_OPTION_IDS.illuminatedSingleFace,
      ),
    ).toBe(PANAFLEX_PRICING_OPTION_IDS.illuminatedSingleFace);
  });
});

describe("usesIlluminatedPanaflexPricing", () => {
  it("activates illuminated pricing only for Panaflex sign options", () => {
    expect(
      usesIlluminatedPanaflexPricing(
        "panaflex",
        PANAFLEX_PRICING_OPTION_IDS.illuminatedSingleFace,
      ),
    ).toBe(true);
    expect(
      usesIlluminatedPanaflexPricing(
        "panaflex",
        PANAFLEX_PRICING_OPTION_IDS.materialOnly,
      ),
    ).toBe(false);
    expect(
      usesIlluminatedPanaflexPricing(
        "banner",
        PANAFLEX_PRICING_OPTION_IDS.illuminatedDoubleFace,
      ),
    ).toBe(false);
  });
});
