export function interpolate(
  x: number,
  lowerBound: number,
  upperBound: number,
  lowerValue: number,
  upperValue: number
): number {
  if (x >= lowerBound && x <= upperBound) {
    const slope = (upperValue - lowerValue) / (upperBound - lowerBound);
    return lowerValue + slope * (x - lowerBound);
  } else if (x < lowerBound) {
    return lowerValue;
  } else {
    return upperValue;
  }
}
