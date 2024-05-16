import * as React from "react";

const { useEffect, useRef } = React;

type IntervalFunction = () => unknown | void;

export function useInterval(callback: IntervalFunction, delayMs: number) {
  const savedCallback = useRef<IntervalFunction>();

  // Remember the latest callback.
  useEffect(() => {
    savedCallback.current = callback;
  }, [callback]);

  // Set up the interval.
  useEffect(() => {
    function tick() {
      savedCallback.current?.();
    }
    const id = setInterval(tick, delayMs);
    return () => clearInterval(id);
  }, [delayMs]);
}
