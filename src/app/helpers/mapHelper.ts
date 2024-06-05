export function addOrUpdateMapArray<T, V>(
  map: Map<T, V[]>,
  key: T,
  value: V
): void {
  if (map.has(key)) {
    // Key exists, so we can safely add the value to the existing array
    map.get(key)!.push(value);
  } else {
    // Key does not exist, so we create a new array with the value and set it in the map
    map.set(key, [value]);
  }
}
