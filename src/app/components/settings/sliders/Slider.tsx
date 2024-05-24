import { ChordsDisplayMode } from "@/app/data/chordsDisplayMode";
import { Theme } from "@/app/data/theme";
import { selectUi } from "@/app/store/uiSlice";
import React from "react";
import { useSelector } from "react-redux";

export interface SliderProps {
  onValueChange: (value: number) => void;
  value: number;
  minimumValue: number;
  maximumValue: number;
  minimumTrackTintColor?: string;
  maximumTrackTintColor?: string;
  step?: number;
  className?: string;
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
  const { chordsDisplayMode, theme } = useSelector(selectUi);
  return (
    <div
      className={`items-center flex ${
        isVertical ? "flex-col" : "flex-row"
      } gap-2 justify-center ${className}`}
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
        <span
          className={`text-nowrap ${
            theme === Theme.Light
              ? "text-foreground-light"
              : "text-foreground-dark"
          } ${labelClass}`}
        >
          {label}
        </span>
      )}
    </div>
  );
};
