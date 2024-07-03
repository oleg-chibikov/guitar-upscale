import { BEATS_IN_BAR, TimeSignature } from "@/app/data/clockConstants";
import {
  StrumDirection,
  StrummingPattern,
  getDefaultSlotsForTimeSignature,
} from "@/app/data/strummingPatterns";
import { Theme } from "@/app/data/theme";
import { useUiSelector } from "@/app/hooks/storeHooks";
import AddIcon from "@mui/icons-material/Add";
import RemoveIcon from "@mui/icons-material/Remove";
import { IconButton, Tooltip } from "@mui/material";
import React, { useMemo } from "react";

interface StrumGridProps {
  pattern: StrummingPattern;
  onStrum: (index: number, newValue: StrumDirection) => void;
  onAdd: () => void;
  onRemove: () => void;
}

// TODO: update rendering - changing a cell shouldn't rerender everything
export const StrumGrid: React.FC<StrumGridProps> = React.memo(
  ({ pattern, onStrum, onAdd, onRemove }) => {
    const theme = useUiSelector((s) => s.theme);

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
      <div className="flex flex-row gap-2 items-center">
        <Tooltip title="Remove Cells">
          <IconButton disabled={pattern.strums.length <= 1} onClick={onRemove}>
            <RemoveIcon />
          </IconButton>
        </Tooltip>
        <div
          className="overflow-x-auto py-4 grid gap-x-1 w-full"
          style={{
            gridTemplateColumns: getGridTemplateColumns,
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
        <Tooltip title="Add Cells">
          <IconButton onClick={onAdd}>
            <AddIcon />
          </IconButton>
        </Tooltip>
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
        className={`w-6 h-6 border border-gray-300 flex items-center justify-center text-xs
        ${
          !isBeatCell
            ? theme === Theme.Light
              ? "bg-panel-light"
              : "bg-panel-dark"
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
StrumGrid.displayName = "StrumGrid";
StrumCell.displayName = "StrumCell";
