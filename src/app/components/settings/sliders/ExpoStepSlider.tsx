import React from "react";
import { Slider, SliderProps } from "./Slider";

export interface StepSliderProps extends Omit<SliderProps, "step"> {
  steps: number[];
}

export const StepSlider: React.FC<StepSliderProps> = ({
  minimumValue,
  maximumValue,
  steps,
  value,
  onValueChange,
  ...rest
}) => {
  const positionToValue = (position: number) => {
    return steps[position];
  };

  const valueToPosition = (value: number) => {
    return steps.indexOf(value);
  };

  const position = valueToPosition(value);
  console.log(position);

  return (
    <Slider
      {...rest}
      onValueChange={(value) => {
        const result = onValueChange(positionToValue(value));
        console.log(result);
        return result;
      }}
      value={position}
      minimumValue={0}
      maximumValue={steps.length - 1}
    />
  );
};
