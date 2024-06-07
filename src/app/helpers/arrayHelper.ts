export function calculateAverage(arr: number[]): number {
  if (arr.length === 0) return 0; // Handle empty array

  const sum = arr.reduce((acc, currentValue) => acc + currentValue, 0);
  const average = sum / arr.length;

  return average;
}

export function findObjectWithMinValue<T>(
  arr: { object: T; number: number }[]
): T {
  const { object: minObject } = arr.reduce((min, current) => {
    return current.number < min.number ? current : min;
  });

  return minObject;
}

export function arrayToMap<T>(array: T[], keyFn: (value: T)=>string): Map<string, T> {
  return array.reduce((map, item) => {
    const key = keyFn(item);
    map.set(key, item);
    return map;
  }, new Map<string, T>());
}