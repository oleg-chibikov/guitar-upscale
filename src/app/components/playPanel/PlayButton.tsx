"use client";
import { UsePlayParams, usePlay } from "@/app/hooks/usePlay";
import { selectSettings } from "@/app/store/settingsSlice";
import HourglassTopIcon from "@mui/icons-material/HourglassTop";
import PlayArrow from "@mui/icons-material/PlayArrow";
import Stop from "@mui/icons-material/Stop";
import React from "react";
import { useSelector } from "react-redux";
import { IconButton } from "../settings/buttons/IconButton";

type PlayButtonProps = UsePlayParams;

export const BasePlayButton: React.FC<PlayButtonProps> = (params) => {
  const { neck, isPlaying } = useSelector(selectSettings);

  const { isWaiting, handlePlay } = usePlay(params);

  if (neck === null) {
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
        isWaiting ? <HourglassTopIcon /> : isPlaying ? <Stop /> : <PlayArrow />
      }
      onPress={handlePlay}
    />
  );
};

export const PlayButton: React.FC = () => <BasePlayButton />;
