"use client";
import { useSettingsSelector } from "@/app/hooks/storeHooks";
import { UsePlayParams, usePlay } from "@/app/hooks/usePlay";
import HourglassTop from "@mui/icons-material/HourglassTop";
import PlayArrow from "@mui/icons-material/PlayArrow";
import Replay from "@mui/icons-material/Replay";
import Stop from "@mui/icons-material/Stop";
import React from "react";
import { IconButtonWrapper } from "../uiFramework/IconButton";

type PlayButtonProps = UsePlayParams;

export const BasePlayButton: React.FC<PlayButtonProps> = (params) => {
  const neck = useSettingsSelector((s) => s.neck);

  const { isWaiting, handlePlay, isReplay, isPlaying } = usePlay(params);

  if (neck === null) {
    return null;
  }

  return (
    <IconButtonWrapper
      isActive={isPlaying}
      tooltip={
        isReplay
          ? "Replay"
          : isWaiting
          ? "Waiting for player to get ready..."
          : isPlaying
          ? "Stop playing"
          : "Play"
      }
      icon={
        isReplay ? (
          <Replay />
        ) : isWaiting ? (
          <HourglassTop />
        ) : isPlaying ? (
          <Stop />
        ) : (
          <PlayArrow />
        )
      }
      onPress={handlePlay}
    />
  );
};

export const PlayButton: React.FC = () => <BasePlayButton />;
