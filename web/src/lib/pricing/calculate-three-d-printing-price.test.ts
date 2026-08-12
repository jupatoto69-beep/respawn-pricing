import { describe, expect, it } from "vitest";

import {
  calculateThreeDPrintingElectricityCost,
  calculateThreeDPrintingHours,
  calculateThreeDPrintingMaterialCost,
  calculateThreeDPrintingPrice,
  formatThreeDPrintingDuration,
  requiresThreeDPrintingManualPriceAuthorization,
  type ThreeDPrintingPricingInput,
} from "./calculate-three-d-printing-price";
import {
  THREE_D_PRINTING_COMMERCIAL_CONFIG,
  THREE_D_PRINTING_MACHINE_CONFIG,
  THREE_D_PRINTING_MATERIAL_IDS,
  THREE_D_PRINTING_MATERIALS,
  THREE_D_PRINTING_MODELING_IDS,
  THREE_D_PRINTING_MODELING_OPTIONS,
} from "./three-d-printing-catalog";

const PRECISE_THREE_D_PRINTING_FIXTURE: ThreeDPrintingPricingInput =
  Object.freeze({
    materialId: THREE_D_PRINTING_MATERIAL_IDS.pla,
    gramsPerUnit: 100,
    printingHoursPerUnit: 5,
    printingMinutesPerUnit: 0,
    quantity: 1,
    modelingId: THREE_D_PRINTING_MODELING_IDS.none,
    manualPrice: Object.freeze({
      enabled: false,
      amountCop: null,
      belowThresholdAuthorized: false,
    }),
  });

function createInput(
  overrides: Partial<ThreeDPrintingPricingInput> = {},
): ThreeDPrintingPricingInput {
  return {
    ...PRECISE_THREE_D_PRINTING_FIXTURE,
    ...overrides,
  };
}

describe("3D printing material and electricity derivation", () => {
  it("derives PLA from its centralized COP 95,000 / 1,000 g spool", () => {
    const config = THREE_D_PRINTING_MATERIALS.pla;
    const cost = calculateThreeDPrintingMaterialCost(
      THREE_D_PRINTING_MATERIAL_IDS.pla,
      100,
    );

    expect(config.spoolPriceCop).toBe(95_000);
    expect(config.spoolWeightGrams).toBe(1_000);
    expect(cost.rawMaterialCostPerUnit).toBe(9_500);
  });

  it("derives PETG independently from its equivalent centralized config", () => {
    const config = THREE_D_PRINTING_MATERIALS.petg;
    const cost = calculateThreeDPrintingMaterialCost(
      THREE_D_PRINTING_MATERIAL_IDS.petg,
      100,
    );

    expect(config).not.toBe(THREE_D_PRINTING_MATERIALS.pla);
    expect(config.spoolPriceCop).toBe(95_000);
    expect(config.spoolWeightGrams).toBe(1_000);
    expect(cost.rawMaterialCostPerUnit).toBe(9_500);
  });

  it("derives the adjusted material cost from the configured 40% increase", () => {
    const config = THREE_D_PRINTING_MATERIALS.pla;
    const cost = calculateThreeDPrintingMaterialCost(config.id, 100);

    expect(config.materialIncreaseRate).toBe(0.4);
    expect(cost.adjustedMaterialCostPerUnit).toBe(
      cost.rawMaterialCostPerUnit * (1 + config.materialIncreaseRate),
    );
    expect(cost.adjustedMaterialCostPerUnit).toBe(13_300);
  });

  it("converts configured 150 W to 0.150 kW", () => {
    const electricity = calculateThreeDPrintingElectricityCost(1, 0);

    expect(THREE_D_PRINTING_MACHINE_CONFIG.printerPowerWatts).toBe(150);
    expect(electricity.printerPowerKilowatts).toBe(0.15);
  });

  it("derives COP 135 per whole printing hour at COP 900/kWh", () => {
    const electricity = calculateThreeDPrintingElectricityCost(1, 0);

    expect(THREE_D_PRINTING_MACHINE_CONFIG.electricityPricePerKwhCop).toBe(
      900,
    );
    expect(electricity.printingTimeHoursPerUnit).toBe(1);
    expect(electricity.electricityCostPerUnit).toBe(135);
  });

  it.each([
    [1, 30, 1.5],
    [0, 30, 0.5],
    [0, 45, 0.75],
  ])("converts %i h %i min to %s hours", (hours, minutes, expected) => {
    expect(calculateThreeDPrintingHours(hours, minutes)).toBe(expected);
  });

  it.each([
    [0, 45, "45 min"],
    [1, 0, "1 h"],
    [5, 30, "5 h 30 min"],
  ])("formats %i h %i min as %s", (hours, minutes, expected) => {
    expect(formatThreeDPrintingDuration(hours, minutes)).toBe(expected);
  });
});

describe("precise 3D printing commercial pricing", () => {
  it("calculates the representative PLA 100 g / 5 h fixture", () => {
    const result = calculateThreeDPrintingPrice(
      PRECISE_THREE_D_PRINTING_FIXTURE,
    );

    expect(result.internal.rawMaterialCostPerUnit).toBe(9_500);
    expect(result.internal.adjustedMaterialCostPerUnit).toBe(13_300);
    expect(result.internal.electricityCostPerUnit).toBe(675);
    expect(result.internal.baseCost).toBe(13_975);
    expect(result.internal.suggestedPriceRaw).toBe(55_900);
    expect(result.internal.authorizationThresholdRaw).toBe(41_925);
    expect(result.suggestedPrice).toBe(56_000);
    expect(result.totalPrice).toBe(56_000);
  });

  it("multiplies material and electricity by quantity but modeling only once", () => {
    const result = calculateThreeDPrintingPrice(
      createInput({
        printingHoursPerUnit: 1,
        printingMinutesPerUnit: 30,
        quantity: 3,
        modelingId: THREE_D_PRINTING_MODELING_IDS.basic,
      }),
    );

    expect(result.internal.adjustedMaterialCostPerUnit).toBe(13_300);
    expect(result.internal.electricityCostPerUnit).toBe(202.5);
    expect(result.internal.variableCost).toBe((13_300 + 202.5) * 3);
    expect(result.internal.modelingCost).toBe(25_000);
    expect(result.internal.baseCost).toBe(65_507.5);
    expect(result.totalPrice).toBe(262_500);
  });

  it.each([
    [THREE_D_PRINTING_MODELING_IDS.none, 0],
    [THREE_D_PRINTING_MODELING_IDS.aiAssisted, 15_000],
    [THREE_D_PRINTING_MODELING_IDS.basic, 25_000],
    [THREE_D_PRINTING_MODELING_IDS.complex, 50_000],
  ])("uses modeling option %s once at COP %i", (modelingId, expected) => {
    const result = calculateThreeDPrintingPrice(
      createInput({ modelingId, quantity: 4 }),
    );

    expect(result.internal.modelingCost).toBe(expected);
    expect(
      THREE_D_PRINTING_MODELING_OPTIONS.find(
        (option) => option.id === modelingId,
      )?.priceCop,
    ).toBe(expected);
  });

  it("derives suggested ×4 and authorization ×3 values from config", () => {
    const result = calculateThreeDPrintingPrice(
      PRECISE_THREE_D_PRINTING_FIXTURE,
    );

    expect(THREE_D_PRINTING_COMMERCIAL_CONFIG.suggestedPriceMultiplier).toBe(
      4,
    );
    expect(
      THREE_D_PRINTING_COMMERCIAL_CONFIG.authorizationThresholdMultiplier,
    ).toBe(3);
    expect(result.internal.suggestedPriceRaw).toBe(
      result.internal.baseCost * 4,
    );
    expect(result.internal.authorizationThresholdRaw).toBe(
      result.internal.baseCost * 3,
    );
  });

  it("enforces the COP 5,000 absolute commercial minimum", () => {
    const result = calculateThreeDPrintingPrice(
      createInput({
        gramsPerUnit: 0.001,
        printingHoursPerUnit: 0,
      }),
    );

    expect(THREE_D_PRINTING_COMMERCIAL_CONFIG.absoluteMinimumPriceCop).toBe(
      5_000,
    );
    expect(result.internal.suggestedPriceRaw).toBeLessThan(5_000);
    expect(result.totalPrice).toBe(5_000);
  });

  it("rounds a suggested COP 55,900 upward to COP 56,000", () => {
    expect(
      calculateThreeDPrintingPrice(PRECISE_THREE_D_PRINTING_FIXTURE)
        .totalPrice,
    ).toBe(56_000);
  });

  it("ignores every manual amount while modification is disabled", () => {
    const result = calculateThreeDPrintingPrice(
      createInput({
        manualPrice: {
          enabled: false,
          amountCop: Number.NaN,
          belowThresholdAuthorized: false,
        },
      }),
    );

    expect(result.priceSource).toBe("suggested");
    expect(result.enteredManualPrice).toBeNull();
    expect(result.totalPrice).toBe(56_000);
  });

  it("accepts a manual price above the raw threshold and then rounds it", () => {
    const result = calculateThreeDPrintingPrice(
      createInput({
        manualPrice: {
          enabled: true,
          amountCop: 42_001,
          belowThresholdAuthorized: false,
        },
      }),
    );

    expect(result.priceSource).toBe("manual");
    expect(result.enteredManualPrice).toBe(42_001);
    expect(result.totalPrice).toBe(42_500);
  });

  it("accepts a manual price exactly at the raw threshold", () => {
    const result = calculateThreeDPrintingPrice(
      createInput({
        manualPrice: {
          enabled: true,
          amountCop: 41_925,
          belowThresholdAuthorized: false,
        },
      }),
    );

    expect(result.internal.authorizationThresholdRaw).toBe(41_925);
    expect(result.totalPrice).toBe(42_000);
  });

  it("does not raise an exact COP 500 multiple unnecessarily", () => {
    const result = calculateThreeDPrintingPrice(
      createInput({
        manualPrice: {
          enabled: true,
          amountCop: 42_000,
          belowThresholdAuthorized: false,
        },
      }),
    );

    expect(result.totalPrice).toBe(42_000);
  });

  it("requires explicit authorization below the raw threshold before rounding", () => {
    expect(() =>
      calculateThreeDPrintingPrice(
        createInput({
          manualPrice: {
            enabled: true,
            amountCop: 41_900,
            belowThresholdAuthorized: false,
          },
        }),
      ),
    ).toThrow("requires authorization");
  });

  it("accepts an authorized price below the threshold and then rounds it", () => {
    const result = calculateThreeDPrintingPrice(
      createInput({
        manualPrice: {
          enabled: true,
          amountCop: 41_901,
          belowThresholdAuthorized: true,
        },
      }),
    );

    expect(result.enteredManualPrice).toBe(41_901);
    expect(result.totalPrice).toBe(42_000);
  });

  it.each([
    [190_000, 190_000],
    [190_100, 190_500],
  ])(
    "accepts authorized batch fixture price COP %i as COP %i",
    (amountCop, expectedTotal) => {
      const input = createInput({
        printingHoursPerUnit: 1,
        printingMinutesPerUnit: 30,
        quantity: 3,
        modelingId: THREE_D_PRINTING_MODELING_IDS.basic,
        manualPrice: {
          enabled: true,
          amountCop,
          belowThresholdAuthorized: true,
        },
      });
      const result = calculateThreeDPrintingPrice(input);

      expect(result.internal.authorizationThresholdRaw).toBe(196_522.5);
      expect(result.totalPrice).toBe(expectedTotal);
    },
  );

  it("classifies only valid sub-threshold manual amounts as confirmable", () => {
    const batchInput = createInput({
      printingHoursPerUnit: 1,
      printingMinutesPerUnit: 30,
      quantity: 3,
      modelingId: THREE_D_PRINTING_MODELING_IDS.basic,
    });

    expect(
      requiresThreeDPrintingManualPriceAuthorization({
        ...batchInput,
        manualPrice: {
          enabled: true,
          amountCop: 190_000,
          belowThresholdAuthorized: false,
        },
      }),
    ).toBe(true);
    expect(() =>
      requiresThreeDPrintingManualPriceAuthorization({
        ...batchInput,
        manualPrice: {
          enabled: true,
          amountCop: 4_999,
          belowThresholdAuthorized: false,
        },
      }),
    ).toThrow("absolute commercial minimum");
  });

  it("does not let rounding authorize an unconfirmed raw amount", () => {
    expect(() =>
      calculateThreeDPrintingPrice(
        createInput({
          manualPrice: {
            enabled: true,
            amountCop: 41_901,
            belowThresholdAuthorized: false,
          },
        }),
      ),
    ).toThrow("requires authorization");
  });

  it("blocks a manual price below COP 5,000 even when authorized", () => {
    expect(() =>
      calculateThreeDPrintingPrice(
        createInput({
          gramsPerUnit: 0.001,
          printingHoursPerUnit: 0,
          manualPrice: {
            enabled: true,
            amountCop: 4_999,
            belowThresholdAuthorized: true,
          },
        }),
      ),
    ).toThrow("absolute commercial minimum");
  });

  it("accepts metrics from an estimator-independent source", () => {
    const estimatedMetrics = Object.freeze({
      gramsPerUnit: 32.5,
      printingHoursPerUnit: 2,
      printingMinutesPerUnit: 15,
    });
    const result = calculateThreeDPrintingPrice(
      createInput({ ...estimatedMetrics }),
    );

    expect(result.gramsPerUnit).toBe(estimatedMetrics.gramsPerUnit);
    expect(result.internal.printingTimeHoursPerUnit).toBe(2.25);
  });

  it("is deterministic, pure and deeply freezes its calculation result", () => {
    const input = createInput();
    const before = JSON.stringify(input);
    const first = calculateThreeDPrintingPrice(input);
    const second = calculateThreeDPrintingPrice(input);

    expect(first).toEqual(second);
    expect(JSON.stringify(input)).toBe(before);
    expect(Object.isFrozen(first)).toBe(true);
    expect(Object.isFrozen(first.internal)).toBe(true);
  });
});

describe("precise 3D printing input validation", () => {
  it.each([
    ["NaN grams", { gramsPerUnit: Number.NaN }],
    ["infinite grams", { gramsPerUnit: Number.POSITIVE_INFINITY }],
    ["negative grams", { gramsPerUnit: -1 }],
    ["zero quantity", { quantity: 0 }],
    ["negative quantity", { quantity: -1 }],
    ["decimal quantity", { quantity: 1.5 }],
    ["NaN quantity", { quantity: Number.NaN }],
    ["negative hours", { printingHoursPerUnit: -1 }],
    ["decimal hours", { printingHoursPerUnit: 1.5 }],
    ["negative minutes", { printingMinutesPerUnit: -1 }],
    ["60 minutes", { printingMinutesPerUnit: 60 }],
    ["decimal minutes", { printingMinutesPerUnit: 1.5 }],
    ["infinite minutes", { printingMinutesPerUnit: Number.POSITIVE_INFINITY }],
  ])("rejects %s", (_name, overrides) => {
    expect(() =>
      calculateThreeDPrintingPrice(createInput(overrides)),
    ).toThrow(RangeError);
  });

  it("rejects a physically empty job", () => {
    expect(() =>
      calculateThreeDPrintingPrice(
        createInput({
          gramsPerUnit: 0,
          printingHoursPerUnit: 0,
          printingMinutesPerUnit: 0,
        }),
      ),
    ).toThrow("must include material or printing time");
  });

  it("rejects invalid material and modeling identifiers at runtime", () => {
    expect(() =>
      calculateThreeDPrintingPrice(
        createInput({ materialId: "abs" as ThreeDPrintingPricingInput["materialId"] }),
      ),
    ).toThrow("material must be valid");
    expect(() =>
      calculateThreeDPrintingPrice(
        createInput({ modelingId: "invalid" as ThreeDPrintingPricingInput["modelingId"] }),
      ),
    ).toThrow("modeling option must be valid");
  });

  it.each([null, Number.NaN, Number.POSITIVE_INFINITY, 0, -1])(
    "rejects invalid enabled manual price %s",
    (amountCop) => {
      expect(() =>
        calculateThreeDPrintingPrice(
          createInput({
            manualPrice: {
              enabled: true,
              amountCop,
              belowThresholdAuthorized: false,
            },
          }),
        ),
      ).toThrow(RangeError);
    },
  );
});
