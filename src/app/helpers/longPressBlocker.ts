export const NO_LONG_PRESS_ATTRIBUTE = "data-no-long-press";

const SCROLLABLE_OVERFLOW = /(auto|scroll)/;

let isBlocking = false;

function findScroller(element: Element | null): Element | null {
  for (let current = element; current; current = current.parentElement) {
    const style = getComputedStyle(current);
    const canScrollX =
      SCROLLABLE_OVERFLOW.test(style.overflowX) &&
      current.scrollWidth > current.clientWidth;
    const canScrollY =
      SCROLLABLE_OVERFLOW.test(style.overflowY) &&
      current.scrollHeight > current.clientHeight;
    if (canScrollX || canScrollY) {
      return current;
    }
  }
  return null;
}

// Chrome on Android vibrates on a long press even when the context menu is
// cancelled. Cancelling touchstart stops the long press, and native scrolling
// with it, so the play areas scroll by hand.
export function blockLongPress() {
  if (isBlocking) {
    return;
  }
  isBlocking = true;
  const lastPositions = new Map<number, { x: number; y: number }>();

  document.addEventListener(
    "touchstart",
    (event) => {
      const target = event.target;
      if (
        !(target instanceof Element) ||
        !target.closest(`[${NO_LONG_PRESS_ATTRIBUTE}]`)
      ) {
        return;
      }
      event.preventDefault();
      for (const touch of Array.from(event.changedTouches)) {
        lastPositions.set(touch.identifier, {
          x: touch.clientX,
          y: touch.clientY,
        });
      }
    },
    { capture: true, passive: false }
  );

  document.addEventListener(
    "touchmove",
    (event) => {
      for (const touch of Array.from(event.changedTouches)) {
        const last = lastPositions.get(touch.identifier);
        if (!last) {
          continue;
        }
        lastPositions.set(touch.identifier, {
          x: touch.clientX,
          y: touch.clientY,
        });
        // A second finger is playing, so moving the first one shouldn't scroll.
        if (event.touches.length > 1) {
          continue;
        }
        findScroller(touch.target as Element)?.scrollBy(
          last.x - touch.clientX,
          last.y - touch.clientY
        );
      }
    },
    { capture: true, passive: true }
  );

  const forget = (event: TouchEvent) => {
    for (const touch of Array.from(event.changedTouches)) {
      lastPositions.delete(touch.identifier);
    }
  };
  document.addEventListener("touchend", forget, true);
  document.addEventListener("touchcancel", forget, true);
}
