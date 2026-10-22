// A press that misses every playable chord still plays the closest one within this distance.
export const MAX_SNAP_DISTANCE_PX = 48;

const pressHandlers = new Map<HTMLElement, () => Promise<void>>();

export const registerChordButtonHitArea = (
  element: HTMLElement,
  onPress: () => Promise<void>
) => {
  pressHandlers.set(element, onPress);
  return () => {
    pressHandlers.delete(element);
  };
};

const distanceToRect = (x: number, y: number, rect: DOMRect) => {
  const dx = Math.max(rect.left - x, 0, x - rect.right);
  const dy = Math.max(rect.top - y, 0, y - rect.bottom);
  return Math.hypot(dx, dy);
};

export const findPressHandlerAt = (
  container: HTMLElement,
  x: number,
  y: number
) => {
  const containerRect = container.getBoundingClientRect();
  let closest: (() => Promise<void>) | undefined;
  let closestDistance = MAX_SNAP_DISTANCE_PX;

  for (const [element, onPress] of pressHandlers) {
    if (!container.contains(element)) {
      continue;
    }
    const rect = element.getBoundingClientRect();
    // skip buttons scrolled out of view
    if (
      rect.bottom < containerRect.top ||
      rect.top > containerRect.bottom ||
      rect.right < containerRect.left ||
      rect.left > containerRect.right
    ) {
      continue;
    }
    const distance = distanceToRect(x, y, rect);
    if (distance === 0) {
      // the press landed on a playable button, which handles it itself
      return undefined;
    }
    if (distance <= closestDistance) {
      closestDistance = distance;
      closest = onPress;
    }
  }

  return closest;
};
