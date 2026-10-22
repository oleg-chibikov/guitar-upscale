// A press that misses every playable chord still plays the closest one within this distance.
export const MAX_SNAP_DISTANCE_PX = 48;

export interface CellRect {
  left: number;
  top: number;
  right: number;
  bottom: number;
}

const distanceToRect = (x: number, y: number, rect: CellRect) => {
  const dx = Math.max(rect.left - x, 0, x - rect.right);
  const dy = Math.max(rect.top - y, 0, y - rect.bottom);
  return Math.hypot(dx, dy);
};

/**
 * Finds the playable cell under the point, or the closest one within the snap distance.
 * Cells scrolled out of the viewport don't count.
 */
export const findClosestCell = <T>(
  cells: Iterable<{ rect: CellRect; value: T }>,
  x: number,
  y: number,
  viewport: CellRect
): T | undefined => {
  let closest: T | undefined;
  let closestDistance = MAX_SNAP_DISTANCE_PX;

  for (const { rect, value } of cells) {
    if (
      rect.bottom < viewport.top ||
      rect.top > viewport.bottom ||
      rect.right < viewport.left ||
      rect.left > viewport.right
    ) {
      continue;
    }
    const distance = distanceToRect(x, y, rect);
    if (distance === 0) {
      return value;
    }
    if (distance <= closestDistance) {
      closestDistance = distance;
      closest = value;
    }
  }

  return closest;
};
