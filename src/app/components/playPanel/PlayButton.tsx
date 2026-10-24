"use client";
import {
  ExamplesMap,
  RANDOM_SONG,
  SongChoice,
  getExampleName,
} from "@/app/data/example";
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
import HourglassTop from "@mui/icons-material/HourglassTop";
import PlayArrow from "@mui/icons-material/PlayArrow";
import Replay from "@mui/icons-material/Replay";
import React, { useCallback, useEffect, useRef } from "react";
import { useDispatch } from "react-redux";
import { IconButtonWrapper } from "../uiFramework/IconButton";
import { SongListButton } from "./SongListButton";

type PlayButtonProps = UsePlayParams;

const getExampleChoices = (examplesMap: ExamplesMap | undefined) =>
  [...(examplesMap?.values() ?? [])]
    .flatMap((scales) => [...scales.values()].flat())
    .sort((a, b) => getExampleName(a).localeCompare(getExampleName(b)));

// a random song stays in the current scale
const getChoiceScale = (choice: SongChoice) =>
  choice === RANDOM_SONG
    ? { scaleGroup: scaleGroupValue, scale: scaleValue }
    : choice;

export const BasePlayButton: React.FC<PlayButtonProps> = (params) => {
  const neck = useSettingsSelector((s) => s.neck);
  const scaleGroup = useSettingsSelector((s) => s.scaleGroup);
  const scale = useSettingsSelector((s) => s.scale);
  const playbackType = useSettingsSelector((s) => s.playbackType);
  const examplesMap = useExamples();
  const dispatch = useDispatch();
  // a song from another scale plays once the store has switched to that scale
  const pending = useRef<{
    choice: SongChoice;
    scaleGroup: string;
    scale: string;
  }>(undefined);

  const { isWaiting, handlePlay, isPlaying, canPlayAgain } = usePlay(params);

  const startExample = useCallback(
    (choice: SongChoice) => {
      const target = getChoiceScale(choice);
      const isSameScale =
        target.scaleGroup === scaleGroupValue && target.scale === scaleValue;
      if (isSameScale && playbackTypeValue === PlaybackType.Melody) {
        void handlePlay(choice);
        return;
      }
      if (playbackTypeValue !== PlaybackType.Melody) {
        dispatch(setPlaybackType(PlaybackType.Melody));
      }
      if (target.scaleGroup !== scaleGroupValue) {
        dispatch(setScaleGroup(target.scaleGroup));
      }
      if (target.scale !== scaleValue) {
        dispatch(setScale(target.scale));
      }
      pending.current = {
        choice,
        scaleGroup: target.scaleGroup,
        scale: target.scale,
      };
    },
    [dispatch, handlePlay],
  );

  useEffect(() => {
    const request = pending.current;
    if (
      request &&
      request.scaleGroup === scaleGroup &&
      request.scale === scale &&
      playbackType === PlaybackType.Melody
    ) {
      pending.current = undefined;
      void handlePlay(request.choice);
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

  return (
    <>
      <IconButtonWrapper
        emphasis
        isActive={isPlaying}
        tooltip={
          isWaiting
            ? "Waiting for player to get ready..."
            : isPlaying
              ? "Replay"
              : canPlayAgain
                ? "Play again"
                : "Play"
        }
        icon={
          isWaiting ? <HourglassTop /> : isPlaying ? <Replay /> : <PlayArrow />
        }
        onPress={() => void handlePlay()}
      />
      {params.decodeExample && choices.length > 0 && (
        <SongListButton
          choices={choices}
          decodeExample={params.decodeExample}
          onChoose={startExample}
        />
      )}
    </>
  );
};

export const PlayButton: React.FC = () => <BasePlayButton />;
