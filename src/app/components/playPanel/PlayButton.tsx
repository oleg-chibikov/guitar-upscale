"use client";
import { Example } from "@/app/data/example";
import { PlaybackType } from "@/app/data/playbackType";
import { useSettingsSelector } from "@/app/hooks/storeHooks";
import { useExamples } from "@/app/hooks/useExamples";
import { UsePlayParams, usePlay } from "@/app/hooks/usePlay";
import {
  setPlaybackType,
  setScale,
  setScaleGroup,
  setTuning,
} from "@/app/store/settingsSlice";
import HourglassTop from "@mui/icons-material/HourglassTop";
import PlayArrow from "@mui/icons-material/PlayArrow";
import Replay from "@mui/icons-material/Replay";
import {
  Divider,
  ListItemText,
  ListSubheader,
  Menu,
  MenuItem,
} from "@mui/material";
import React, { useEffect, useRef, useState } from "react";
import { useDispatch } from "react-redux";
import { IconButtonWrapper } from "../uiFramework/IconButton";

type PlayButtonProps = UsePlayParams;

type ExampleChoice = {
  scaleGroup: string;
  scale: string;
  example: Example;
};

const getExampleName = (example: Example) =>
  `${example.band} - ${example.title}`;

const getExampleChoices = (
  examplesMap: Map<string, Map<string, Example[]>> | undefined,
  currentScaleGroup: string,
  currentScale: string
) => {
  const choices: ExampleChoice[] = [];
  examplesMap?.forEach((scales, scaleGroup) =>
    scales.forEach((examples, scale) =>
      examples.forEach((example) =>
        choices.push({ scaleGroup, scale, example })
      )
    )
  );
  choices.sort((a, b) =>
    getExampleName(a.example).localeCompare(getExampleName(b.example))
  );
  const isCurrent = (choice: ExampleChoice) =>
    choice.scaleGroup === currentScaleGroup && choice.scale === currentScale;
  return {
    current: choices.filter(isCurrent),
    others: choices.filter((choice) => !isCurrent(choice)),
  };
};

export const BasePlayButton: React.FC<PlayButtonProps> = (params) => {
  const neck = useSettingsSelector((s) => s.neck);
  const scaleGroup = useSettingsSelector((s) => s.scaleGroup);
  const scale = useSettingsSelector((s) => s.scale);
  const tuning = useSettingsSelector((s) => s.tuning);
  const playbackType = useSettingsSelector((s) => s.playbackType);
  const examplesMap = useExamples();
  const dispatch = useDispatch();
  const [menuAnchor, setMenuAnchor] = useState<HTMLElement | null>(null);
  // a song from another scale plays once the store has switched to that scale
  const pending = useRef<ExampleChoice>(undefined);

  const { isWaiting, handlePlay, isPlaying } = usePlay(params);

  useEffect(() => {
    const choice = pending.current;
    if (
      choice &&
      choice.scaleGroup === scaleGroup &&
      choice.scale === scale &&
      playbackType === PlaybackType.Melody
    ) {
      pending.current = undefined;
      void handlePlay(choice.example);
    }
  }, [scaleGroup, scale, tuning, playbackType, handlePlay]);

  if (neck === null) {
    return null;
  }

  const { current, others } = params.decodeExample
    ? getExampleChoices(examplesMap, scaleGroup, scale)
    : { current: [], others: [] };
  const canChoose = current.length > 0 || others.length > 0;

  const playChosen = (choice: ExampleChoice) => {
    setMenuAnchor(null);
    const isSameScale =
      choice.scaleGroup === scaleGroup && choice.scale === scale;
    const exampleTuning = choice.example.tuning;
    const needsTuning = exampleTuning !== undefined && exampleTuning !== tuning;
    if (isSameScale && playbackType === PlaybackType.Melody && !needsTuning) {
      void handlePlay(choice.example);
      return;
    }
    if (playbackType !== PlaybackType.Melody) {
      dispatch(setPlaybackType(PlaybackType.Melody));
    }
    if (choice.scaleGroup !== scaleGroup) {
      dispatch(setScaleGroup(choice.scaleGroup));
    }
    if (!isSameScale) {
      dispatch(setScale(choice.scale));
    }
    if (needsTuning) {
      dispatch(setTuning(exampleTuning));
    }
    pending.current = choice;
  };

  const sections = [
    { label: `${scale} (current)`, choices: current, showScale: false },
    { label: "Other scales", choices: others, showScale: true },
  ].filter((section) => section.choices.length > 0);

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
        slotProps={{
          paper: {
            sx: { maxHeight: "calc(100dvh - 32px)", maxWidth: "90vw" },
          },
        }}
      >
        {sections.flatMap(({ label, choices, showScale }, index) => [
          index > 0 && <Divider key={`divider ${label}`} />,
          <ListSubheader key={`header ${label}`}>{label}</ListSubheader>,
          ...choices.map((choice) => (
            <MenuItem
              key={`${choice.scaleGroup} ${choice.scale} ${getExampleName(
                choice.example
              )}`}
              dense
              onClick={() => playChosen(choice)}
            >
              <ListItemText
                primary={getExampleName(choice.example)}
                secondary={
                  showScale
                    ? `${choice.scale} (${choice.scaleGroup})`
                    : undefined
                }
              />
            </MenuItem>
          )),
        ])}
      </Menu>
    </>
  );
};

export const PlayButton: React.FC = () => <BasePlayButton />;
