import {
  Pattern,
  StrumDirection,
  TimeSignature,
  getDefaultSlotsForTimeSignature,
} from "@/app/data/strummingData";
import { Theme } from "@/app/data/theme";
import { BEATS_IN_BAR } from "@/app/engine/clock/clockConstants";
import { selectUi } from "@/app/store/uiSlice";
import React, { useMemo } from "react";
import { useSelector } from "react-redux";

interface StrumGridProps {
  pattern: Pattern;
  onStrum: (index: number, newValue: StrumDirection) => void;
}

export const StrumGrid: React.FC<StrumGridProps> = React.memo(
  ({ pattern, onStrum }) => {
    const { theme } = useSelector(selectUi);

    const groupSize = 4;
    const totalSlots = pattern.strums.length;

    const getGridTemplateColumns = useMemo((): string => {
      const groups = Math.ceil(totalSlots / groupSize);

      return (
        Array(groups).fill(`repeat(${groupSize}, 1fr) 8px`).join(" ").trim() +
        (totalSlots % groupSize
          ? ` repeat(${totalSlots % groupSize}, 1fr)`
          : "")
      );
    }, [totalSlots]);

    const slotsPerBeat = useMemo(() => {
      return pattern.timeSignature === TimeSignature.ONE_BEAT ||
        pattern.timeSignature === TimeSignature.ONE_BAR ||
        pattern.timeSignature === TimeSignature.HALF_BAR
        ? 1
        : getDefaultSlotsForTimeSignature(pattern.timeSignature) / BEATS_IN_BAR;
    }, [pattern.timeSignature]);

    return (
      <div className="overflow-x-auto py-4">
        <div
          className="grid gap-x-1 w-full"
          style={{
            gridTemplateColumns: getGridTemplateColumns,
            width: "max-content",
          }}
        >
          {pattern.strums.map((strum, index) => (
            <React.Fragment key={index}>
              <StrumCell
                strum={strum}
                index={index}
                onStrum={onStrum}
                theme={theme}
                isBeatCell={index % slotsPerBeat === 0}
              />
              {(index + 1) % groupSize === 0 &&
                index !== pattern.strums.length - 1 && <div className="w-2" />}
            </React.Fragment>
          ))}
        </div>
      </div>
    );
  }
);

interface StrumCellProps {
  strum: StrumDirection;
  index: number;
  onStrum: (index: number, newValue: StrumDirection) => void;
  theme: Theme;
  isBeatCell: boolean;
}

const StrumCell: React.FC<StrumCellProps> = React.memo(
  ({ strum, index, onStrum, theme, isBeatCell }) => {
    const handleClick = () => {
      const newValue: StrumDirection =
        strum === "↑" ? "↓" : strum === "↓" ? "" : "↑";
      onStrum(index, newValue);
    };

    return (
      <button
        onClick={handleClick}
        className={`w-4 h-4 border border-gray-300 flex items-center justify-center text-xs
        ${
          isBeatCell
            ? theme === Theme.Light
              ? "bg-primary-light"
              : "bg-primary-dark"
            : theme === Theme.Light
            ? "bg-secondary-light"
            : "bg-secondary-dark"
        }
        ${
          theme === Theme.Light
            ? "text-foreground-light"
            : "text-foreground-dark"
        }`}
      >
        {strum}
      </button>
    );
  }
);
