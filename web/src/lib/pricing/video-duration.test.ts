import { describe, expect, it } from "vitest";

import { parseVideoDuration } from "./video-duration";

describe("parseVideoDuration", () => {
  it.each([
    [{ minutes: "0", seconds: "0" }, "Duration must be greater than zero."],
    [{ minutes: "", seconds: "20" }, "Minutes are required."],
    [{ minutes: "1", seconds: "" }, "Seconds are required."],
    [{ minutes: "-1", seconds: "20" }, "Minutes must be non-negative."],
    [{ minutes: "1", seconds: "-1" }, "Seconds must be non-negative."],
    [{ minutes: "1.5", seconds: "20" }, "Minutes must be an integer."],
    [{ minutes: "1", seconds: "20.5" }, "Seconds must be an integer."],
    [{ minutes: "1", seconds: "60" }, "Seconds must be between 0 and 59."],
    [
      { minutes: "not-a-number", seconds: "20" },
      "Minutes must be a valid number.",
    ],
    [
      { minutes: "1", seconds: "not-a-number" },
      "Seconds must be a valid number.",
    ],
  ])("rejects invalid duration %j", (input, message) => {
    expect(() => parseVideoDuration(input)).toThrowError(message);
  });

  it("accepts and converts a valid whole-number duration", () => {
    expect(parseVideoDuration({ minutes: "3", seconds: "35" })).toEqual({
      enteredMinutes: 3,
      enteredSeconds: 35,
      totalSeconds: 215,
    });
  });
});
