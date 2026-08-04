import { describe, expect, it } from "vitest";

import { COMPUTER_SERVICE_IDS } from "./computer-service-catalog";
import {
  changeServiceCategorySelection,
  changeServiceSelection,
  createInitialServicesPricingFormState,
} from "./service-selection";
import {
  AUDIOVISUAL_SERVICE_IDS,
  SERVICE_CATEGORY_IDS,
} from "./service-catalog";

describe("service selection", () => {
  it("starts without a category, service, or strategy-specific values", () => {
    expect(createInitialServicesPricingFormState()).toEqual({
      categoryId: "",
      serviceId: "",
      specificValues: { pricingStrategy: "none" },
    });
  });

  it("starts video editing with required duration fields empty", () => {
    const audiovisualSelection = changeServiceCategorySelection(
      createInitialServicesPricingFormState(),
      SERVICE_CATEGORY_IDS.audiovisual,
    );

    expect(
      changeServiceSelection(
        audiovisualSelection,
        AUDIOVISUAL_SERVICE_IDS.simpleVideoEditing,
      ),
    ).toEqual({
      categoryId: SERVICE_CATEGORY_IDS.audiovisual,
      serviceId: AUDIOVISUAL_SERVICE_IDS.simpleVideoEditing,
      specificValues: {
        pricingStrategy: "duration",
        duration: { minutes: "", seconds: "" },
      },
    });
  });

  it("changing category clears the selected service and video duration", () => {
    const videoSelection = {
      categoryId: SERVICE_CATEGORY_IDS.audiovisual,
      serviceId: AUDIOVISUAL_SERVICE_IDS.simpleVideoEditing,
      specificValues: {
        pricingStrategy: "duration" as const,
        duration: { minutes: "3", seconds: "35" },
      },
    };

    expect(
      changeServiceCategorySelection(
        videoSelection,
        SERVICE_CATEGORY_IDS.computers,
      ),
    ).toEqual({
      categoryId: SERVICE_CATEGORY_IDS.computers,
      serviceId: "",
      specificValues: { pricingStrategy: "none" },
    });
  });

  it("clears video duration when the selected service is cleared", () => {
    const videoSelection = {
      categoryId: SERVICE_CATEGORY_IDS.audiovisual,
      serviceId: AUDIOVISUAL_SERVICE_IDS.simpleVideoEditing,
      specificValues: {
        pricingStrategy: "duration" as const,
        duration: { minutes: "2", seconds: "1" },
      },
    };

    expect(changeServiceSelection(videoSelection, "")).toEqual({
      categoryId: SERVICE_CATEGORY_IDS.audiovisual,
      serviceId: "",
      specificValues: { pricingStrategy: "none" },
    });
  });

  it("changing service clears previous strategy-specific values", () => {
    const computerSelection = {
      categoryId: SERVICE_CATEGORY_IDS.computers,
      serviceId: COMPUTER_SERVICE_IDS.maintenance,
      specificValues: {
        pricingStrategy: "maintenance-selection" as const,
        quantity: "4",
        maintenance: { physical: true, system: true },
      },
    };

    expect(
      changeServiceSelection(
        computerSelection,
        COMPUTER_SERVICE_IDS.officeInstallation,
      ),
    ).toEqual({
      categoryId: SERVICE_CATEGORY_IDS.computers,
      serviceId: COMPUTER_SERVICE_IDS.officeInstallation,
      specificValues: {
        pricingStrategy: "fixed-price",
        quantity: "1",
      },
    });
  });

  it("does not allow a service from a different category", () => {
    const audiovisualSelection = createInitialServicesPricingFormState(
      SERVICE_CATEGORY_IDS.audiovisual,
    );

    expect(
      changeServiceSelection(
        audiovisualSelection,
        COMPUTER_SERVICE_IDS.officeInstallation,
      ),
    ).toEqual(audiovisualSelection);
  });
});
