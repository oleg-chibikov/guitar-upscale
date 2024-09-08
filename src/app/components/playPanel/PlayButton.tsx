"use client";
import { useSettingsSelector } from "@/app/hooks/storeHooks";
import { UsePlayParams, usePlay } from "@/app/hooks/usePlay";
import HourglassTop from "@mui/icons-material/HourglassTop";
import PlayArrow from "@mui/icons-material/PlayArrow";
import Replay from "@mui/icons-material/Replay";
import React from "react";
import { IconButtonWrapper } from "../uiFramework/IconButton";

type PlayButtonProps = UsePlayParams;

export const BasePlayButton: React.FC<PlayButtonProps> = (params) => {
  const neck = useSettingsSelector((s) => s.neck);

  const { isWaiting, handlePlay, isPlaying } = usePlay(params);

  if (neck === null) {
    return null;
  }

  return (
    <IconButtonWrapper
      isActive={isPlaying}
      tooltip={
        isWaiting
          ? "Waiting for player to get ready..."
          : isPlaying
          ? "Replay"
          : "Play"
      }
      icon={
        isWaiting ? <HourglassTop /> : isPlaying ? <Replay /> : <PlayArrow />
      }
      onPress={handlePlay}
    />
  );
};

export const PlayButton: React.FC = () => <BasePlayButton />;
