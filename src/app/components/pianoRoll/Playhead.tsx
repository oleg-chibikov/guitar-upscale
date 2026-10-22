import { playheadTick$ } from "@/app/engine/pianoRoll/playhead";
import { tickToX, Zoom } from "@/app/engine/pianoRoll/geometry";
import React, { useEffect, useRef } from "react";

interface PlayheadProps {
  zoom: Zoom;
  // the ruler shows a marker, the grid shows a line
  variant: "line" | "marker";
}

export const Playhead: React.FC<PlayheadProps> = ({ zoom, variant }) => {
  const ref = useRef<HTMLDivElement>(null);

  // moves the element directly, so playback doesn't re-render the notes every tick
  useEffect(() => {
    const subscription = playheadTick$.subscribe((tick) => {
      if (ref.current) {
        ref.current.style.transform = `translateX(${tickToX(tick, zoom)}px)`;
      }
    });
    return () => subscription.unsubscribe();
  }, [zoom]);

  if (variant === "marker") {
    return (
      <div
        ref={ref}
        className="absolute left-0 bottom-0 pointer-events-none z-[1]"
        style={{ willChange: "transform" }}
      >
        <div className="-translate-x-1/2 w-0 h-0 border-x-[6px] border-x-transparent border-t-[9px] border-t-red-500" />
      </div>
    );
  }

  return (
    <div
      ref={ref}
      className="absolute left-0 top-0 h-full w-px bg-red-500 pointer-events-none z-[4]"
      style={{ willChange: "transform" }}
    />
  );
};
