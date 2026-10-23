import { ChordsDisplayMode } from "@/app/data/chordsDisplayMode";
import { Theme } from "@/app/data/theme";
import { WithClassName } from "@/app/helpers/withClassName";
import { useUiSelector } from "@/app/hooks/storeHooks";
import { Typography } from "@mui/material";
import React from "react";

export interface SliderProps extends WithClassName {
  onValueChange: (value: number) => void;
  value: number;
  minimumValue: number;
  maximumValue: number;
  minimumTrackTintColor?: string;
  maximumTrackTintColor?: string;
  step?: number;
  isVertical?: boolean;
  label?: string;
  labelClass?: string;
}

export const Slider: React.FC<SliderProps> = ({
  onValueChange,
  value,
  minimumValue,
  maximumValue,
  step = 1,
  className,
  isVertical = false,
  label,
  labelClass,
}) => {
  const chordsDisplayMode = useUiSelector((s) => s.chordsDisplayMode);
  const theme = useUiSelector((s) => s.theme);
  return (
    <div
      className={`flex items-center ${
        isVertical ? "flex-col" : "flex-row"
      } justify-center gap-2 ${className}`}
    >
      <div
        className={`${isVertical ? "h-full" : "w-full"} flex items-center ${
          isVertical
            ? chordsDisplayMode === ChordsDisplayMode.Left
              ? "justify-end"
              : "justify-start"
            : "justify-center"
        }`}
      >
        <input
          type="range"
          className={`cursor-pointer ${
            theme === Theme.Light
              ? "accent-primary-light"
              : "accent-primary-dark"
          }`}
          min={minimumValue}
          max={maximumValue}
          value={value}
          step={step}
          onChange={(event) =>
            onValueChange !== undefined &&
            onValueChange(parseInt(event.target.value))
          }
          style={{
            appearance: isVertical ? ("slider-vertical" as never) : undefined,
            width: isVertical ? "5px" : "100%",
            height: isVertical ? "100%" : "5px",
          }}
        />
      </div>
      {label !== undefined && (
        <Typography
          className={`text-nowrap ${
            theme === Theme.Light
              ? "text-foreground-light"
              : "text-foreground-dark"
          } ${labelClass}`}
        >
          {label}
        </Typography>
      )}
    </div>
  );
};
