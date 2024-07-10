import { BEATS_IN_BAR, TICKS_IN_BEAT } from "@/app/data/clockConstants";
import React, { forwardRef } from "react";

interface TimelineProps {
  width: number;
  pixelsPerTick: number;
}

export const Timeline = forwardRef<HTMLDivElement, TimelineProps>(
  ({ width, pixelsPerTick }, ref) => {
    const beatWidth = TICKS_IN_BEAT * pixelsPerTick;
    const totalBars = Math.ceil(width / (BEATS_IN_BAR * beatWidth));

    return (
      <div
        ref={ref}
        className="absolute z-10 h-8 bg-gray-200 border-b border-gray-300"
        style={{ width }}
      >
        {Array.from({ length: totalBars }).map((_, barIndex) => (
          <React.Fragment key={barIndex}>
            {Array.from({ length: BEATS_IN_BAR }).map((_, beatIndex) => {
              const xPosition =
                (barIndex * BEATS_IN_BAR + beatIndex) * beatWidth;
              return (
                <div
                  key={`${barIndex}-${beatIndex}`}
                  className="absolute h-full flex items-end justify-start"
                  style={{ left: `${xPosition}px`, width: beatWidth }}
                >
                  <div
                    className={`h-full border-l ${
                      beatIndex === 0 ? "border-gray-600" : "border-gray-400"
                    }`}
                  />
                  {beatIndex === 0 && (
                    <span className="text-xs pl-1 pb-1 text-gray-600">
                      {barIndex + 1}
                    </span>
                  )}
                </div>
              );
            })}
          </React.Fragment>
        ))}
      </div>
    );
  }
);

Timeline.displayName = "Timeline";
