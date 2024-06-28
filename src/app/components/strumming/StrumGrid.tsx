import {
  Pattern,
  StrumDirection,
  TimeSignature,
  getSlotsForTimeSignature,
} from "@/app/data/strummingData";
import { Theme } from "@/app/data/theme";
import { selectUi } from "@/app/store/uiSlice";
import React from "react";
import { useSelector } from "react-redux";

interface StrumGridProps {
  pattern: Pattern;
  onStrum: (index: number, newValue: StrumDirection) => void;
}

export const StrumGrid: React.FC<StrumGridProps> = React.memo(
  ({ pattern, onStrum }) => {
    const { theme } = useSelector(selectUi);

    const groupSize = 4; //timeSignature.includes("triplet") ? 3 : 4;

    const getGridTemplateColumns = (timeSignature: TimeSignature): string => {
      const totalSlots = getSlotsForTimeSignature(timeSignature);
      const groups = Math.ceil(totalSlots / groupSize);

      return (
        Array(groups).fill(`repeat(${groupSize}, 1fr) 8px`).join(" ").trim() +
        (totalSlots % groupSize
          ? ` repeat(${totalSlots % groupSize}, 1fr)`
          : "")
      );
    };

    return (
      <div className="overflow-x-auto py-4">
        <div
          className="grid gap-x-1 w-full"
          style={{
            gridTemplateColumns: getGridTemplateColumns(pattern.timeSignature),
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
}

const StrumCell: React.FC<StrumCellProps> = React.memo(
  ({ strum, index, onStrum, theme }) => {
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
          theme === Theme.Light
            ? "bg-white text-black"
            : "bg-gray-800 text-white"
        }`}
      >
        {strum}
      </button>
    );
  }
);
