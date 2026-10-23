"use client";
import { Example, ExamplesMap, getExampleName } from "@/app/data/example";
import { PlaybackType } from "@/app/data/playbackType";
import { useSettingsSelector } from "@/app/hooks/storeHooks";
import { useExamples } from "@/app/hooks/useExamples";
import { UsePlayParams, usePlay } from "@/app/hooks/usePlay";
import {
  playbackTypeValue,
  scaleGroupValue,
  scaleValue,
  setPlaybackType,
  setScale,
  setScaleGroup,
} from "@/app/store/settingsSlice";
import Delete from "@mui/icons-material/Delete";
import HourglassTop from "@mui/icons-material/HourglassTop";
import PlayArrow from "@mui/icons-material/PlayArrow";
import Replay from "@mui/icons-material/Replay";
import { IconButton, ListItemText, Menu, MenuItem } from "@mui/material";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { useDispatch } from "react-redux";
import { IconButtonWrapper } from "../uiFramework/IconButton";

type PlayButtonProps = UsePlayParams;

const getExampleChoices = (examplesMap: ExamplesMap | undefined) => {
  const choices: Example[] = [];
  examplesMap?.forEach((scales) =>
    scales.forEach((examples) => choices.push(...examples)),
  );
  choices.sort((a, b) => getExampleName(a).localeCompare(getExampleName(b)));
  return choices;
};

export const BasePlayButton: React.FC<PlayButtonProps> = (params) => {
  const neck = useSettingsSelector((s) => s.neck);
  const scaleGroup = useSettingsSelector((s) => s.scaleGroup);
  const scale = useSettingsSelector((s) => s.scale);
  const playbackType = useSettingsSelector((s) => s.playbackType);
  const examplesMap = useExamples();
  const dispatch = useDispatch();
  const [menuAnchor, setMenuAnchor] = useState<HTMLElement | null>(null);
  // a song from another scale plays once the store has switched to that scale
  const pending = useRef<Example>(undefined);

  const { isWaiting, handlePlay, isPlaying } = usePlay(params);

  const startExample = useCallback(
    (choice: Example) => {
      const isSameScale =
        choice.scaleGroup === scaleGroupValue && choice.scale === scaleValue;
      if (isSameScale && playbackTypeValue === PlaybackType.Melody) {
        void handlePlay(choice);
        return;
      }
      if (playbackTypeValue !== PlaybackType.Melody) {
        dispatch(setPlaybackType(PlaybackType.Melody));
      }
      if (choice.scaleGroup !== scaleGroupValue) {
        dispatch(setScaleGroup(choice.scaleGroup));
      }
      if (choice.scale !== scaleValue) {
        dispatch(setScale(choice.scale));
      }
      pending.current = choice;
    },
    [dispatch, handlePlay],
  );

  useEffect(() => {
    const choice = pending.current;
    if (
      choice &&
      choice.scaleGroup === scaleGroup &&
      choice.scale === scale &&
      playbackType === PlaybackType.Melody
    ) {
      pending.current = undefined;
      void handlePlay(choice);
    }
  }, [scaleGroup, scale, playbackType, handlePlay]);

  useEffect(() => {
    if (!params.decodeExample) {
      return;
    }
    let unsubscribe: (() => void) | undefined;
    let active = true;
    void import("@/app/engine/songs/songLibrary").then(
      ({ songPlayRequests }) => {
        if (active) {
          const subscription = songPlayRequests.subscribe(startExample);
          unsubscribe = () => subscription.unsubscribe();
        }
      },
    );
    return () => {
      active = false;
      unsubscribe?.();
    };
  }, [params.decodeExample, startExample]);

  if (neck === null) {
    return null;
  }

  const choices = params.decodeExample ? getExampleChoices(examplesMap) : [];
  const canChoose = choices.length > 0;
  const isCurrent = (choice: Example) =>
    choice.scaleGroup === scaleGroup && choice.scale === scale;

  const playChosen = (choice: Example) => {
    setMenuAnchor(null);
    startExample(choice);
  };

  const removeChosen = async (choice: Example) => {
    const { removeUserSong } = await import("@/app/engine/songs/songLibrary");
    await removeUserSong(choice);
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
        slotProps={{
          paper: {
            sx: { maxHeight: "calc(100dvh - 32px)", maxWidth: "90vw" },
          },
        }}
      >
        {choices.map((choice) => (
          <MenuItem key={choice.id} dense onClick={() => playChosen(choice)}>
            <ListItemText
              primary={getExampleName(choice)}
              secondary={`${choice.scale} (${choice.scaleGroup})${
                choice.isUserSong ? ", uploaded" : ""
              }`}
              slotProps={{
                primary: isCurrent(choice)
                  ? { sx: { color: "success.main", fontWeight: "bold" } }
                  : undefined,
              }}
            />
            {choice.isUserSong && (
              <IconButton
                edge="end"
                size="small"
                aria-label={`Delete ${getExampleName(choice)}`}
                title="Delete the uploaded song"
                onClick={(event) => {
                  event.stopPropagation();
                  void removeChosen(choice);
                }}
              >
                <Delete fontSize="small" />
              </IconButton>
            )}
          </MenuItem>
        ))}
      </Menu>
    </>
  );
};

export const PlayButton: React.FC = () => <BasePlayButton />;
