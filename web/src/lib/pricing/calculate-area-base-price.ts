export function calculateAreaBasePrice(
  lengthCm: number,
  widthCm: number,
  ratePerSquareMeter: number,
  quantity: number,
): number {
  if (!Number.isFinite(lengthCm)) {
    throw new RangeError("Length must be finite.");
  }

  if (lengthCm <= 0) {
    throw new RangeError("Length must be greater than zero.");
  }

  if (!Number.isFinite(widthCm)) {
    throw new RangeError("Width must be finite.");
  }

  if (widthCm <= 0) {
    throw new RangeError("Width must be greater than zero.");
  }

  if (!Number.isFinite(ratePerSquareMeter)) {
    throw new RangeError("Rate per square meter must be finite.");
  }

  if (ratePerSquareMeter < 0) {
    throw new RangeError("Rate per square meter must not be negative.");
  }

  if (!Number.isFinite(quantity)) {
    throw new RangeError("Quantity must be finite.");
  }

  if (!Number.isInteger(quantity)) {
    throw new RangeError("Quantity must be an integer.");
  }

  if (quantity <= 0) {
    throw new RangeError("Quantity must be greater than zero.");
  }

  const areaInSquareMeters = (lengthCm * widthCm) / 10_000;

  return areaInSquareMeters * ratePerSquareMeter * quantity;
}
