export const RECORDER_CAPACITY_COMPATIBILITY_STATUSES = {
  compatible: "compatible",
  warning: "warning",
} as const;

export type RecorderCapacityCompatibilityStatus =
  (typeof RECORDER_CAPACITY_COMPATIBILITY_STATUSES)[keyof typeof RECORDER_CAPACITY_COMPATIBILITY_STATUSES];

export type RecorderCapacityCompatibility =
  | Readonly<{
      status: typeof RECORDER_CAPACITY_COMPATIBILITY_STATUSES.compatible;
      hasWarning: false;
      isBlocking: false;
    }>
  | Readonly<{
      status: typeof RECORDER_CAPACITY_COMPATIBILITY_STATUSES.warning;
      hasWarning: true;
      isBlocking: false;
    }>;

function validatePositiveSafeInteger(value: number, fieldName: string): number {
  if (!Number.isFinite(value)) {
    throw new RangeError(`${fieldName} must be a finite number.`);
  }

  if (!Number.isSafeInteger(value)) {
    throw new RangeError(`${fieldName} must be a safe integer.`);
  }

  if (value <= 0) {
    throw new RangeError(`${fieldName} must be greater than zero.`);
  }

  return value;
}

export function checkRecorderCapacityCompatibility(
  cameraQuantity: number,
  recorderChannels: number,
): RecorderCapacityCompatibility {
  const validCameraQuantity = validatePositiveSafeInteger(
    cameraQuantity,
    "Camera quantity",
  );
  const validRecorderChannels = validatePositiveSafeInteger(
    recorderChannels,
    "Recorder channels",
  );

  if (validCameraQuantity > validRecorderChannels) {
    return {
      status: RECORDER_CAPACITY_COMPATIBILITY_STATUSES.warning,
      hasWarning: true,
      isBlocking: false,
    };
  }

  return {
    status: RECORDER_CAPACITY_COMPATIBILITY_STATUSES.compatible,
    hasWarning: false,
    isBlocking: false,
  };
}
