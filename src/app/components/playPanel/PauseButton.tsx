"use client";
import { useSettingsSelector } from "@/app/hooks/storeHooks";
import { setIsPaused } from "@/app/store/settingsSlice";
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
      tooltip={isPaused ? "Continue playing" : "Play scale"}
      icon={isPaused ? <PlayArrow /> : <Pause />}
      onPress={() => {
        dispatch(setIsPaused(!isPaused));
      }}
    />
  );
};
