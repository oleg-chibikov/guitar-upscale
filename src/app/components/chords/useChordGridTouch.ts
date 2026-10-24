import React, { RefObject, useRef } from "react";
import { ChordGridStore } from "./chordGridStore";

// Fingers that land closer together than this scroll the grid instead of playing.
export const TWO_FINGER_WINDOW_MS = 150;

interface ActiveTouch {
  startedAt: number;
  chordName: string | undefined;
}

export const startsScroll = (
  now: number,
  otherStarts: number[],
  landingCount: number,
) =>
  landingCount > 1 ||
  otherStarts.some((startedAt) => now - startedAt <= TWO_FINGER_WINDOW_MS);

const getCentre = (touches: React.TouchList, ids: Set<number>) => {
  let x = 0;
  let y = 0;
  let count = 0;
  for (const touch of Array.from(touches)) {
    if (ids.has(touch.identifier)) {
      x += touch.clientX;
      y += touch.clientY;
      count++;
    }
  }
  return count ? { x: x / count, y: y / count } : undefined;
};

/**
 * One finger plays a chord. Two fingers put down together scroll the grid and play no chord.
 */
export const useChordGridTouch = (
  store: ChordGridStore,
  scrollerRef: RefObject<HTMLElement | null>,
  findChord: (clientX: number, clientY: number) => string | undefined,
) => {
  const activeRef = useRef(new Map<number, ActiveTouch>());
  const scrollIdsRef = useRef(new Set<number>());
  const centreRef = useRef<{ x: number; y: number } | undefined>(undefined);

  const onTouchStart = (e: React.TouchEvent) => {
    const active = activeRef.current;
    const scrollIds = scrollIdsRef.current;
    const now = performance.now();
    const landing = Array.from(e.changedTouches);
    const isScroll =
      scrollIds.size > 0 ||
      startsScroll(
        now,
        Array.from(active.values(), (touch) => touch.startedAt),
        landing.length,
      );

    if (isScroll) {
      for (const [id, touch] of active) {
        if (
          !scrollIds.has(id) &&
          now - touch.startedAt <= TWO_FINGER_WINDOW_MS
        ) {
          if (touch.chordName !== undefined) {
            store.release(touch.chordName);
          }
          scrollIds.add(id);
        }
      }
    }

    for (const touch of landing) {
      if (isScroll) {
        active.set(touch.identifier, { startedAt: now, chordName: undefined });
        scrollIds.add(touch.identifier);
        continue;
      }
      const chordName = findChord(touch.clientX, touch.clientY);
      active.set(touch.identifier, { startedAt: now, chordName });
      if (chordName !== undefined) {
        store.press(chordName);
      }
    }
    centreRef.current = isScroll ? getCentre(e.touches, scrollIds) : undefined;
  };

  const onTouchMove = (e: React.TouchEvent) => {
    const scrollIds = scrollIdsRef.current;
    // a single finger scrolls through the long press blocker
    if (scrollIds.size === 0 || e.touches.length < 2) {
      centreRef.current = undefined;
      return;
    }
    const centre = getCentre(e.touches, scrollIds);
    const last = centreRef.current;
    centreRef.current = centre;
    if (centre && last) {
      scrollerRef.current?.scrollBy(last.x - centre.x, last.y - centre.y);
    }
  };

  const onTouchEnd = (e: React.TouchEvent) => {
    for (const touch of Array.from(e.changedTouches)) {
      activeRef.current.delete(touch.identifier);
      scrollIdsRef.current.delete(touch.identifier);
    }
    centreRef.current = undefined;
  };

  return { onTouchStart, onTouchMove, onTouchEnd, onTouchCancel: onTouchEnd };
};
