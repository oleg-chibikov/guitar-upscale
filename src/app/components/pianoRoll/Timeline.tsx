import {
  BEATS_IN_BAR,
  TICKS_IN_BAR,
  TICKS_IN_BEAT,
  TIMELINE_HEIGHT,
} from "@/app/data/pianoRollConstants";
import { Zoom } from "@/app/engine/pianoRoll/geometry";
import React, { forwardRef, memo } from "react";

interface TimelineProps {
  zoom: Zoom;
  totalTicks: number;
  className?: string;
  onPointerDown?: (e: React.PointerEvent<HTMLDivElement>) => void;
  children?: React.ReactNode;
}

const MIN_LABEL_SPACING_PX = 32;

const TimelineComponent = forwardRef<HTMLDivElement, TimelineProps>(
  ({ zoom, totalTicks, className, onPointerDown, children }, ref) => {
    const barWidth = TICKS_IN_BAR * zoom.pixelsPerTick;
    const beatWidth = TICKS_IN_BEAT * zoom.pixelsPerTick;
    const totalBars = Math.ceil(totalTicks / TICKS_IN_BAR);
    // zoomed out, only every 2nd, 4th, 8th bar gets a number
    let labelEvery = 1;
    while (barWidth * labelEvery < MIN_LABEL_SPACING_PX) {
      labelEvery *= 2;
    }
    const labels = [];
    for (let bar = 0; bar < totalBars; bar += labelEvery) {
      labels.push(
        <span
          key={bar}
          className="absolute bottom-0 pl-1 pb-0.5 text-[11px] leading-none text-gray-700 border-l border-gray-600 h-full flex items-end"
          style={{ left: bar * barWidth }}
        >
          {bar + 1}
        </span>
      );
    }

    return (
      <div
        ref={ref}
        className={`${className ?? ""} bg-gray-200 border-b border-gray-400 select-none touch-none cursor-text`}
        style={{
          height: TIMELINE_HEIGHT,
          backgroundImage:
            beatWidth >= 6
              ? `repeating-linear-gradient(to right, #9ca3af 0 1px, transparent 1px ${beatWidth}px)`
              : undefined,
          backgroundSize: `auto ${TIMELINE_HEIGHT / 3}px`,
          backgroundPosition: "bottom left",
          backgroundRepeat: "repeat-x",
        }}
        onPointerDown={onPointerDown}
        title={`${BEATS_IN_BAR}/4`}
      >
        {labels}
        {children}
      </div>
    );
  }
);

TimelineComponent.displayName = "Timeline";

export const Timeline = memo(TimelineComponent);
