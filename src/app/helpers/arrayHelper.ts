export function calculateAverage(arr: number[]): number {
  if (arr.length === 0) return 0; // Handle empty array

  const sum = arr.reduce((acc, currentValue) => acc + currentValue, 0);
  const average = sum / arr.length;

  return average;
}
