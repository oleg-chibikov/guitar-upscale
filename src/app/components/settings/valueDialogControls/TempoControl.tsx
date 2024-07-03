import { ValueDialogControl } from "@/app/components/uiFramework/ValueDialogControl";
import { tempoSteps } from "@/app/data/tempo";
import { useSettingsSelector } from "@/app/hooks/storeHooks";
import { setTempoBpm } from "@/app/store/settingsSlice";
import Speed from "@mui/icons-material/Speed";
import React from "react";
import { useDispatch } from "react-redux";

export const TempoControl: React.FC = () => {
  const tempoBpm = useSettingsSelector((s) => s.tempoBpm);
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
