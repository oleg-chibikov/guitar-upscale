"use client";
import { UsePlayParams, usePlay } from "@/app/hooks/usePlay";
import { chordsMap, selectSettings } from "@/app/store/settingsSlice";
import HourglassTopIcon from "@mui/icons-material/HourglassTop";
import Pause from "@mui/icons-material/Pause";
import PlayArrow from "@mui/icons-material/PlayArrow";
import React from "react";
import { useSelector } from "react-redux";
import { IconButton } from "./IconButton";

type PlayButtonProps = UsePlayParams;

export const BasePlayButton: React.FC<PlayButtonProps> = (params) => {
  const { neck, isPlaying } = useSelector(selectSettings);

  const { isWaiting, handlePlay } = usePlay(params);

  if (!neck) {
    return null;
  }
  if (!chordsMap) {
    return null;
  }

  return (
    <IconButton
      isActive={isPlaying}
      tooltip={
        isWaiting
          ? "Waiting for the next bar..."
          : isPlaying
          ? "Stop playing scale"
          : "Play scale"
      }
      icon={
        isWaiting ? <HourglassTopIcon /> : isPlaying ? <Pause /> : <PlayArrow />
      }
      onPress={handlePlay}
    />
  );
};

export const PlayButton: React.FC = () => <BasePlayButton />;
