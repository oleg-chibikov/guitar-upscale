"use client";
import { selectSettings, setIsPaused } from "@/app/store/settingsSlice";
import Pause from "@mui/icons-material/Pause";
import PlayArrow from "@mui/icons-material/PlayArrow";
import React from "react";
import { useDispatch, useSelector } from "react-redux";
import { IconButton } from "../settings/buttons/IconButton";

export const PauseButton: React.FC = () => {
  const { isPaused, isPlaying, isLooperPlaying } = useSelector(selectSettings);
  const dispatch = useDispatch();
  if (!isPlaying || isLooperPlaying) {
    return null;
  }
  return (
    <IconButton
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
