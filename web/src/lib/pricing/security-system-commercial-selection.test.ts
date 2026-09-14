import { describe, expect, it } from "vitest";

import { ACCESSORY_CATALOG } from "./security-system-catalog/accessory-catalog";
import { POE_SWITCH_CATALOG } from "./security-system-catalog/poe-switch-catalog";
import {
  addSecuritySystemOptionalComponent,
  changeSecuritySystemOptionalComponentProduct,
  changeSecuritySystemOptionalComponentQuantity,
  createInitialSecuritySystemCommercialSelection,
  removeSecuritySystemOptionalComponent,
  resetSecuritySystemCommercialSelectionForSystemType,
  resolveSecuritySystemOptionalComponentPricingInputs,
} from "./security-system-commercial-selection";

describe("Security System commercial selection", () => {
  it("starts without paid optional components", () => {
    expect(
      createInitialSecuritySystemCommercialSelection().optionalComponents,
    ).toEqual([]);
  });

  it("adds, updates and removes multiple manual optional rows", () => {
    let selection = createInitialSecuritySystemCommercialSelection();
    selection = addSecuritySystemOptionalComponent(
      selection,
      "ip",
      "switch-row",
      "poe-switch",
    );
    selection = addSecuritySystemOptionalComponent(
      selection,
      "ip",
      "accessory-row",
      "additional-accessory",
    );
    expect(selection.optionalComponents).toHaveLength(2);
    expect(selection.optionalComponents[0]).toMatchObject({
      productId: null,
      quantity: "1",
    });

    selection = changeSecuritySystemOptionalComponentProduct(
      selection,
      "switch-row",
      POE_SWITCH_CATALOG[0].id,
    );
    selection = changeSecuritySystemOptionalComponentQuantity(
      selection,
      "switch-row",
      "3",
    );
    selection = changeSecuritySystemOptionalComponentProduct(
      selection,
      "accessory-row",
      ACCESSORY_CATALOG[0].id,
    );
    const resolved = resolveSecuritySystemOptionalComponentPricingInputs(
      selection.optionalComponents,
    );
    expect(resolved[0]).toMatchObject({
      componentType: "poe-switch",
      product: POE_SWITCH_CATALOG[0],
      quantity: 3,
    });

    selection = removeSecuritySystemOptionalComponent(
      selection,
      "switch-row",
    );
    expect(selection.optionalComponents.map(({ id }) => id)).toEqual([
      "accessory-row",
    ]);
  });

  it("does not add an optional family to an incompatible system", () => {
    const initial = createInitialSecuritySystemCommercialSelection();
    expect(
      addSecuritySystemOptionalComponent(
        initial,
        "analog",
        "switch-row",
        "poe-switch",
      ),
    ).toBe(initial);
  });

  it("clears incompatible and additional billable state on system transition", () => {
    let selection = createInitialSecuritySystemCommercialSelection();
    selection = addSecuritySystemOptionalComponent(
      selection,
      "ip",
      "switch-row",
      "poe-switch",
    );
    selection = addSecuritySystemOptionalComponent(
      selection,
      "ip",
      "accessory-row",
      "additional-accessory",
    );

    const transitioned = resetSecuritySystemCommercialSelectionForSystemType(
      selection,
    );
    expect(transitioned.optionalComponents).toEqual([]);
    expect(transitioned.cameraGroups).toEqual({});
    expect(transitioned.hardDriveSelectionId).toBeNull();
    expect(transitioned.recorderConfigurationId).toBeNull();
  });

  it("does not accept a product identity from another catalog family", () => {
    let selection = addSecuritySystemOptionalComponent(
      createInitialSecuritySystemCommercialSelection(),
      "ip",
      "switch-row",
      "poe-switch",
    );
    selection = changeSecuritySystemOptionalComponentProduct(
      selection,
      "switch-row",
      ACCESSORY_CATALOG[0].id,
    );
    expect(selection.optionalComponents[0].productId).toBeNull();
  });
});
