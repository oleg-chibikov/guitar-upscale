import { selectSettings, setTempoBpm } from "@/app/store/settingsSlice";
import React from "react";
import { useDispatch, useSelector } from "react-redux";
import { StepSlider } from "./StepSlider";

const generateStepsArray = () => {
  const steps = [];

  for (let i = 25; i < 80; i += 5) {
    steps.push(i);
  }

  for (let i = 80; i < 180; i++) {
    steps.push(i);
  }

  for (let i = 180; i < 300; i += 5) {
    steps.push(i);
  }

  for (let i = 300; i < 400; i += 25) {
    steps.push(i);
  }

  for (let i = 400; i <= 500; i += 50) {
    steps.push(i);
  }

  return steps;
};

const steps = generateStepsArray();

export const TempoSlider: React.FC = () => {
  const { tempoBpm } = useSelector(selectSettings);
  const dispatch = useDispatch();

  const handleSliderChange = (value: number) => {
    dispatch(setTempoBpm({ tempo: value, updateInterval: true }));
  };

  return (
    <>
      <span>Tempo:</span>
      <StepSlider
        onValueChange={handleSliderChange}
        value={tempoBpm}
        steps={steps}
        label={`${tempoBpm} BPM`}
        labelClass="w-20"
      />
    </>
  );
};
