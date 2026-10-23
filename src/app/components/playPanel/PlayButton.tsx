"use client";
import { Example } from "@/app/data/example";
import { PlaybackType } from "@/app/data/playbackType";
import { useSettingsSelector } from "@/app/hooks/storeHooks";
import { useExamples } from "@/app/hooks/useExamples";
import { UsePlayParams, usePlay } from "@/app/hooks/usePlay";
import HourglassTop from "@mui/icons-material/HourglassTop";
import PlayArrow from "@mui/icons-material/PlayArrow";
import Replay from "@mui/icons-material/Replay";
import { Menu, MenuItem } from "@mui/material";
import React, { useState } from "react";
import { IconButtonWrapper } from "../uiFramework/IconButton";

type PlayButtonProps = UsePlayParams;

export const BasePlayButton: React.FC<PlayButtonProps> = (params) => {
  const neck = useSettingsSelector((s) => s.neck);
  const scaleGroup = useSettingsSelector((s) => s.scaleGroup);
  const scale = useSettingsSelector((s) => s.scale);
  const playbackType = useSettingsSelector((s) => s.playbackType);
  const examplesMap = useExamples();
  const [menuAnchor, setMenuAnchor] = useState<HTMLElement | null>(null);

  const { isWaiting, handlePlay, isPlaying } = usePlay(params);

  if (neck === null) {
    return null;
  }

  const examples =
    params.decodeExample && playbackType === PlaybackType.Melody
      ? examplesMap?.get(scaleGroup)?.get(scale) ?? []
      : [];
  const canChoose = examples.length > 0;

  const playChosen = (example: Example) => {
    setMenuAnchor(null);
    void handlePlay(example);
  };

  return (
    <>
      <IconButtonWrapper
        isActive={isPlaying}
        tooltip={
          isWaiting
            ? "Waiting for player to get ready..."
            : isPlaying
            ? "Replay"
            : canChoose
            ? "Play (hold to pick a song)"
            : "Play"
        }
        icon={
          isWaiting ? <HourglassTop /> : isPlaying ? <Replay /> : <PlayArrow />
        }
        onPress={() => void handlePlay()}
        onLongPress={canChoose ? setMenuAnchor : undefined}
      />
      <Menu
        anchorEl={menuAnchor}
        open={menuAnchor !== null}
        onClose={() => setMenuAnchor(null)}
      >
        {examples.map((example) => (
          <MenuItem
            key={`${example.band} - ${example.title}`}
            onClick={() => playChosen(example)}
          >
            {example.band} - {example.title}
          </MenuItem>
        ))}
      </Menu>
    </>
  );
};

export const PlayButton: React.FC = () => <BasePlayButton />;
