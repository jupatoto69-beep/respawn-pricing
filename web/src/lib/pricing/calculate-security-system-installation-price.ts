import {
  getSecuritySystemInstallationOption,
  type SecuritySystemInstallationTypeId,
} from "./security-system-options";

export type SecuritySystemInstallationPriceCalculation = Readonly<{
  cameraQuantity: number;
  installationTypeId: SecuritySystemInstallationTypeId;
  pricePerCameraCop: number;
  totalPriceCop: number;
}>;

function validateCameraQuantity(cameraQuantity: number): number {
  if (!Number.isFinite(cameraQuantity)) {
    throw new RangeError("Camera quantity must be a finite number.");
  }

  if (!Number.isSafeInteger(cameraQuantity)) {
    throw new RangeError("Camera quantity must be a safe integer.");
  }

  if (cameraQuantity <= 0) {
    throw new RangeError("Camera quantity must be greater than zero.");
  }

  return cameraQuantity;
}

export function calculateSecuritySystemInstallationPrice(
  cameraQuantity: number,
  installationTypeId: string,
): SecuritySystemInstallationPriceCalculation {
  const validCameraQuantity = validateCameraQuantity(cameraQuantity);
  const installationOption = getSecuritySystemInstallationOption(
    installationTypeId,
  );
  const totalPriceCop =
    validCameraQuantity * installationOption.pricePerCameraCop;

  if (!Number.isSafeInteger(totalPriceCop)) {
    throw new RangeError(
      "Security system installation total must be a safe integer.",
    );
  }

  return {
    cameraQuantity: validCameraQuantity,
    installationTypeId: installationOption.id,
    pricePerCameraCop: installationOption.pricePerCameraCop,
    totalPriceCop,
  };
}
