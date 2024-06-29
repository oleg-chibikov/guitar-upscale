"use client";
import { UsePlayParams, usePlay } from "@/app/hooks/usePlay";
import { selectSettings } from "@/app/store/settingsSlice";
import HourglassTopIcon from "@mui/icons-material/HourglassTop";
import PlayArrow from "@mui/icons-material/PlayArrow";
import Stop from "@mui/icons-material/Stop";
import React from "react";
import { useSelector } from "react-redux";
import { IconButtonWrapper } from "../uiFramework/IconButton";

type PlayButtonProps = UsePlayParams;

export const BasePlayButton: React.FC<PlayButtonProps> = (params) => {
  const { neck, isPlaying } = useSelector(selectSettings);

  const { isWaiting, handlePlay } = usePlay(params);

  if (neck === null) {
    return null;
  }

  return (
    <IconButtonWrapper
      isActive={isPlaying}
      activeBg="error"
      tooltip={
        isWaiting
          ? "Waiting for player to get ready..."
          : isPlaying
          ? "Stop playing"
          : "Play"
      }
      icon={
        isWaiting ? <HourglassTopIcon /> : isPlaying ? <Stop /> : <PlayArrow />
      }
      onPress={handlePlay}
    />
  );
};

export const PlayButton: React.FC = () => <BasePlayButton />;
