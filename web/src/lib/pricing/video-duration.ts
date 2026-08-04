export type VideoDurationInput = Readonly<{
  minutes: string;
  seconds: string;
}>;

export type ParsedVideoDuration = Readonly<{
  enteredMinutes: number;
  enteredSeconds: number;
  totalSeconds: number;
}>;

const UNSIGNED_INTEGER_PATTERN = /^\d+$/;

export function createInitialVideoDurationInput(): VideoDurationInput {
  return {
    minutes: "",
    seconds: "",
  };
}

function parseDurationPart(
  value: string,
  fieldName: "Minutes" | "Seconds",
): number {
  const normalizedValue = value.trim();

  if (normalizedValue === "") {
    throw new RangeError(`${fieldName} are required.`);
  }

  const parsedValue = Number(normalizedValue);

  if (!Number.isFinite(parsedValue)) {
    throw new RangeError(`${fieldName} must be a valid number.`);
  }

  if (parsedValue < 0) {
    throw new RangeError(`${fieldName} must be non-negative.`);
  }

  if (
    !UNSIGNED_INTEGER_PATTERN.test(normalizedValue) ||
    !Number.isSafeInteger(parsedValue)
  ) {
    throw new RangeError(`${fieldName} must be an integer.`);
  }

  return parsedValue;
}

export function parseVideoDuration(
  input: VideoDurationInput,
): ParsedVideoDuration {
  const enteredMinutes = parseDurationPart(input.minutes, "Minutes");
  const enteredSeconds = parseDurationPart(input.seconds, "Seconds");

  if (enteredSeconds > 59) {
    throw new RangeError("Seconds must be between 0 and 59.");
  }

  const totalSeconds = enteredMinutes * 60 + enteredSeconds;

  if (!Number.isSafeInteger(totalSeconds)) {
    throw new RangeError("Duration must be within the supported range.");
  }

  if (totalSeconds === 0) {
    throw new RangeError("Duration must be greater than zero.");
  }

  return {
    enteredMinutes,
    enteredSeconds,
    totalSeconds,
  };
}
