import Konva from "konva";
import { RefObject, useLayoutEffect } from "react";

// canvases past this size fail on mobile Safari
const MAX_CANVAS_PIXELS = 16_000_000;

export const getSafePixelRatio = (width: number, height: number) =>
  Math.min(
    window.devicePixelRatio || 1,
    Math.sqrt(MAX_CANVAS_PIXELS / Math.max(1, width * height))
  );

/**
 * Lowers the layer's resolution when a big stage would go past the mobile canvas limit.
 */
export const useSafePixelRatio = (
  layerRefs: RefObject<Konva.Layer | null>[],
  width: number,
  height: number
) => {
  useLayoutEffect(() => {
    const ratio = getSafePixelRatio(width, height);
    for (const layerRef of layerRefs) {
      const layer = layerRef.current;
      if (layer && layer.getCanvas().getPixelRatio() !== ratio) {
        layer.getCanvas().setPixelRatio(ratio);
        layer.batchDraw();
      }
    }
    // the refs are stable
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [width, height]);
};

export const getNativeContext = (context: Konva.Context) =>
  context._context as CanvasRenderingContext2D;
