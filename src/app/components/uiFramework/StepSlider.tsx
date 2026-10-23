import React, { useMemo } from "react";
import { Slider, SliderProps } from "./Slider";

export interface StepSliderProps extends Omit<
  SliderProps,
  "step" | "minimumValue" | "maximumValue"
> {
  steps: number[];
}

export const StepSlider: React.FC<StepSliderProps> = ({
  steps,
  value,
  onValueChange,
  ...rest
}) => {
  // Calculate the value-to-position map only when steps change
  const valueToPositionMap = useMemo(() => {
    const map: Record<number, number> = {};
    steps.forEach((step, index) => {
      map[step] = index;
    });
    return map;
  }, [steps]);

  const positionToValue = (position: number) => {
    return steps[position];
  };

  const valueToPosition = (value: number) => {
    return valueToPositionMap[value];
  };

  const position = valueToPosition(value);

  return (
    <Slider
      {...rest}
      onValueChange={(newValue) => {
        const result = onValueChange(positionToValue(newValue));
        return result;
      }}
      value={position}
      minimumValue={0}
      maximumValue={steps.length - 1}
    />
  );
};
