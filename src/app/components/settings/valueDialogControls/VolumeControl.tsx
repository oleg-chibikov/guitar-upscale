import { ValueDialogControl } from "@/app/components/uiFramework/ValueDialogControl";
import { volumeSteps } from "@/app/data/volume";
import { useSettingsSelector } from "@/app/hooks/storeHooks";
import { setVolume } from "@/app/store/settingsSlice";
import VolumeDown from "@mui/icons-material/VolumeDown";
import VolumeMute from "@mui/icons-material/VolumeMute";
import VolumeOff from "@mui/icons-material/VolumeOff";
import VolumeUp from "@mui/icons-material/VolumeUp";
import React from "react";
import { useDispatch } from "react-redux";

export const VolumeControl: React.FC = () => {
  const volume = useSettingsSelector((s) => s.volume);
  const dispatch = useDispatch();

  const handleSliderChange = (value: number) => {
    dispatch(setVolume(value));
  };

  return (
    <ValueDialogControl
      label="Volume"
      icon={
        volume === 0 ? (
          <VolumeOff />
        ) : volume < 25 ? (
          <VolumeMute />
        ) : volume < 75 ? (
          <VolumeDown />
        ) : (
          <VolumeUp />
        )
      }
      value={volume}
      setValue={handleSliderChange}
      steps={volumeSteps}
    />
  );
};
