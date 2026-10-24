import { RootState } from "@/app/store/store";
import { setFretboardScaleX, setFretboardScaleY } from "@/app/store/uiSlice";
import { RefObject, useEffect } from "react";
import { useDispatch, useStore } from "react-redux";
import {
  Axes,
  getDominantAxis,
  getPinchFactor,
  getSpread,
  hasPinchStarted,
  zoomFretboard,
} from "./fretboardZoom";

type Pinch = {
  ids: [number, number];
  startSpread: Axes;
  startScale?: Axes;
  lockedAxis?: keyof Axes;
};

const WHEEL_ZOOM_SPEED = 0.01;

export const useFretboardPinchZoom = (
  containerRef: RefObject<HTMLElement | null>,
  enabled: boolean,
) => {
  const dispatch = useDispatch();
  const store = useStore<RootState>();

  useEffect(() => {
    const element = containerRef.current;
    if (!enabled || !element) {
      return;
    }
    let pinch: Pinch | undefined;

    const getScale = (): Axes => {
      const { fretboardScaleX, fretboardScaleY } = store.getState().ui;
      return { x: fretboardScaleX, y: fretboardScaleY };
    };

    // with a locked ratio one axis moves the other, so only one may lead
    const apply = (scale: Axes, axis?: keyof Axes) => {
      if (axis !== "y") {
        dispatch(setFretboardScaleX(scale.x));
      }
      if (axis !== "x") {
        dispatch(setFretboardScaleY(scale.y));
      }
    };

    const findTouch = (list: TouchList, id: number) =>
      Array.from(list).find((touch) => touch.identifier === id);

    const handleTouchStart = (e: TouchEvent) => {
      const touches = e.targetTouches;
      if (touches.length !== 2) {
        pinch = undefined;
        return;
      }
      pinch = {
        ids: [touches[0].identifier, touches[1].identifier],
        startSpread: getSpread(touches[0], touches[1]),
      };
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!pinch) {
        return;
      }
      const a = findTouch(e.targetTouches, pinch.ids[0]);
      const b = findTouch(e.targetTouches, pinch.ids[1]);
      if (!a || !b) {
        return;
      }
      const spread = getSpread(a, b);
      if (!pinch.startScale) {
        if (!hasPinchStarted(pinch.startSpread, spread)) {
          return;
        }
        const travel = {
          x: Math.max(spread.x, 1) / Math.max(pinch.startSpread.x, 1),
          y: Math.max(spread.y, 1) / Math.max(pinch.startSpread.y, 1),
        };
        pinch.lockedAxis = store.getState().ui.lockRatio
          ? getDominantAxis(travel)
          : undefined;
        pinch.startSpread = spread;
        pinch.startScale = getScale();
      }
      if (e.cancelable) {
        e.preventDefault();
      }
      apply(
        zoomFretboard(
          pinch.startScale,
          getPinchFactor(pinch.startSpread, spread),
        ),
        pinch.lockedAxis,
      );
    };

    const handleTouchEnd = (e: TouchEvent) => {
      if (pinch && pinch.ids.some((id) => !findTouch(e.targetTouches, id))) {
        pinch = undefined;
      }
    };

    // a trackpad pinch arrives as a wheel event with ctrlKey set
    const handleWheel = (e: WheelEvent) => {
      if (!e.ctrlKey) {
        return;
      }
      e.preventDefault();
      const factor = Math.exp(-e.deltaY * WHEEL_ZOOM_SPEED);
      apply(
        zoomFretboard(getScale(), { x: factor, y: factor }),
        store.getState().ui.lockRatio ? "x" : undefined,
      );
    };

    element.addEventListener("touchstart", handleTouchStart);
    element.addEventListener("touchmove", handleTouchMove, { passive: false });
    element.addEventListener("touchend", handleTouchEnd);
    element.addEventListener("touchcancel", handleTouchEnd);
    element.addEventListener("wheel", handleWheel, { passive: false });
    return () => {
      element.removeEventListener("touchstart", handleTouchStart);
      element.removeEventListener("touchmove", handleTouchMove);
      element.removeEventListener("touchend", handleTouchEnd);
      element.removeEventListener("touchcancel", handleTouchEnd);
      element.removeEventListener("wheel", handleWheel);
    };
  }, [containerRef, enabled, dispatch, store]);
};
