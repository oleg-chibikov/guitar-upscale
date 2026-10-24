import {
  maxXZoom,
  maxYZoom,
  minXZoom,
  minYZoom,
} from "@/app/data/fretboardZoomLimits";

export type Axes = { x: number; y: number };

// fingers closer than this give a jumpy ratio, so that axis keeps its scale
export const MIN_PINCH_SPREAD_PX = 30;
// two fingers that barely move are a chord, so zoom waits for this much travel
export const PINCH_START_PX = 24;

const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));

export const getSpread = (
  a: { clientX: number; clientY: number },
  b: { clientX: number; clientY: number },
): Axes => ({
  x: Math.abs(a.clientX - b.clientX),
  y: Math.abs(a.clientY - b.clientY),
});

export const getPinchFactor = (start: Axes, now: Axes): Axes => {
  const factor = (from: number, to: number) =>
    from >= MIN_PINCH_SPREAD_PX ? Math.max(to, 1) / from : 1;
  return { x: factor(start.x, now.x), y: factor(start.y, now.y) };
};

export const hasPinchStarted = (start: Axes, now: Axes) =>
  Math.abs(now.x - start.x) >= PINCH_START_PX ||
  Math.abs(now.y - start.y) >= PINCH_START_PX;

// spreading the fingers divides the scale, which draws the board larger
export const zoomFretboard = (scale: Axes, factor: Axes): Axes => ({
  x: clamp(scale.x / factor.x, minXZoom, maxXZoom),
  y: clamp(scale.y / factor.y, minYZoom, maxYZoom),
});

export const getDominantAxis = (factor: Axes): keyof Axes =>
  Math.abs(Math.log(factor.x)) >= Math.abs(Math.log(factor.y)) ? "x" : "y";
