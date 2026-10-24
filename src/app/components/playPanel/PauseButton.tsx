import { togglePause } from "@/app/helpers/togglePause";
import { useSettingsSelector } from "@/app/hooks/storeHooks";
import Pause from "@mui/icons-material/Pause";
import PlayArrow from "@mui/icons-material/PlayArrow";
import React from "react";
import { useDispatch } from "react-redux";
import { IconButtonWrapper } from "../uiFramework/IconButton";

export const PauseButton: React.FC = () => {
  const isLooperPlaying = useSettingsSelector((s) => s.isLooperPlaying);
  const isPlaying = useSettingsSelector((s) => s.isPlaying);
  const isPaused = useSettingsSelector((s) => s.isPaused);
  const dispatch = useDispatch();
  if (!isPlaying || isLooperPlaying) {
    return null;
  }
  return (
    <IconButtonWrapper
      disabled={!isPlaying}
      isActive={false}
      tooltip={isPaused ? "Continue playing (Space)" : "Pause playback (Space)"}
      icon={isPaused ? <PlayArrow /> : <Pause />}
      onPress={() => togglePause(dispatch)}
    />
  );
};
