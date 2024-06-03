"use client";
import { UsePlayParams } from "@/app/hooks/usePlay";
import { selectSettings, setIsPaused } from "@/app/store/settingsSlice";
import Pause from "@mui/icons-material/Pause";
import PlayArrow from "@mui/icons-material/PlayArrow";
import React from "react";
import { useDispatch, useSelector } from "react-redux";
import { IconButton } from "../settings/buttons/IconButton";

type PlayButtonProps = UsePlayParams;

export const PauseButton: React.FC<PlayButtonProps> = (params) => {
  const { isPaused, isPlaying } = useSelector(selectSettings);
  const dispatch = useDispatch();
  if (!isPlaying) {
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
