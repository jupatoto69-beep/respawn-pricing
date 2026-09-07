import { describe, expect, it } from "vitest";

import {
  checkRecorderCapacityCompatibility,
  RECORDER_CAPACITY_COMPATIBILITY_STATUSES,
} from "./recorder-capacity-compatibility";

describe("checkRecorderCapacityCompatibility", () => {
  it.each([
    [8, 8],
    [4, 8],
  ])("returns no warning for %i cameras and %i channels", (cameras, channels) => {
    expect(checkRecorderCapacityCompatibility(cameras, channels)).toEqual({
      status: RECORDER_CAPACITY_COMPATIBILITY_STATUSES.compatible,
      hasWarning: false,
      isBlocking: false,
    });
  });

  it("returns a non-blocking warning when cameras exceed channels", () => {
    expect(checkRecorderCapacityCompatibility(10, 8)).toEqual({
      status: RECORDER_CAPACITY_COMPATIBILITY_STATUSES.warning,
      hasWarning: true,
      isBlocking: false,
    });
  });
});
