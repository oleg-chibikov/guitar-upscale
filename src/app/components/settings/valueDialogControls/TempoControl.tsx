import { tempoSteps } from "@/app/data/tempo";
import { selectSettings, setTempoBpm } from "@/app/store/settingsSlice";
import Speed from "@mui/icons-material/Speed";
import React from "react";
import { useDispatch, useSelector } from "react-redux";
import { ValueDialogControl } from "./ValueDialogControl";

export const TempoControl: React.FC = () => {
  const { tempoBpm } = useSelector(selectSettings);
  const dispatch = useDispatch();

  const handleSliderChange = (value: number) => {
    dispatch(setTempoBpm({ tempo: value, updateInterval: true }));
  };

  return (
    <ValueDialogControl
      label="Tempo"
      icon={<Speed />}
      value={tempoBpm}
      setValue={handleSliderChange}
      steps={tempoSteps}
      postfix="BPM"
    />
  );
};
