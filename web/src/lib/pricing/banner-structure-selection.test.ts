import { describe, expect, it } from "vitest";

import {
  BANNER_STRUCTURE_OPTION_IDS,
  DEFAULT_BANNER_STRUCTURE_OPTION_ID,
} from "./banner-structure-options";
import { changeBannerStructureSelection } from "./banner-structure-selection";

describe("changeBannerStructureSelection", () => {
  it("selects material only by default when changing to Banner", () => {
    expect(
      changeBannerStructureSelection("printed-vinyl", "banner", null),
    ).toBe(DEFAULT_BANNER_STRUCTURE_OPTION_ID);
  });

  it("clears the Banner option when changing to another product", () => {
    expect(
      changeBannerStructureSelection(
        "banner",
        "panaflex",
        BANNER_STRUCTURE_OPTION_IDS.doubleFace,
      ),
    ).toBeNull();
  });

  it("preserves the option while Banner remains selected", () => {
    expect(
      changeBannerStructureSelection(
        "banner",
        "banner",
        BANNER_STRUCTURE_OPTION_IDS.singleFace,
      ),
    ).toBe(BANNER_STRUCTURE_OPTION_IDS.singleFace);
  });
});
