import { ChordsDisplayMode } from "@/app/data/chordsDisplayMode";
import { Theme, selectControlPanel } from "@/app/store/controlPanelSlice";
import React from "react";
import { useSelector } from "react-redux";

interface SliderProps {
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

const Slider: React.FC<SliderProps> = ({
  onValueChange,
  value,
  minimumValue,
  maximumValue,
  step = 1,
  className,
  isVertical,
  label,
  labelClass,
}) => {
  const { chordsDisplayMode, theme } = useSelector(selectControlPanel);
  return (
    <div
      className={`items-center flex ${
        isVertical ? "flex-col" : "flex-row"
      } gap-2 justify-center`}
    >
      <div
        className={`w-full flex items-center ${
          "justify-" +
          (isVertical
            ? chordsDisplayMode === ChordsDisplayMode.Left
              ? "end"
              : "start"
            : "center")
        } ${className}`}
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
            onValueChange && onValueChange(parseInt(event.target.value))
          }
          style={{
            appearance: isVertical ? ("slider-vertical" as any) : undefined,
            width: isVertical ? "5px" : "100%",
            height: isVertical ? "100%" : "5px",
          }}
        />
      </div>
      {label && (
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

export { Slider };
