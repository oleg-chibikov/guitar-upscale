"use client";
import { Example } from "@/app/data/example";
import { getNoteText } from "@/app/data/notes";
import { PlaybackType } from "@/app/data/playbackType";
import { parseStringToNotes } from "@/app/data/tunings";
import { PlayParams } from "@/app/engine/eventBus";
import { PlayExampleParameters } from "@/app/engine/examplePlayer";
import { waitForNextBeat, waitForNextTick } from "@/app/engine/mainClock";
import { initMetronome } from "@/app/engine/sound/metronomeProvider";
import { initSoundfont } from "@/app/engine/sound/soundHelper";
import { setAndShowAlert } from "@/app/store/uiSlice";
import HourglassTopIcon from "@mui/icons-material/HourglassTop";
import Pause from "@mui/icons-material/Pause";
import PlayArrow from "@mui/icons-material/PlayArrow";
import React, { useCallback, useEffect, useState } from "react";
import ReactGA from "react-ga4";
import { useDispatch, useSelector } from "react-redux";
import {
  isMetronomeTicking,
  selectSettings,
  setTempoBpm,
  velocityValue,
} from "../../../store/settingsSlice";
import { IconButton } from "./IconButton";

const melodyType = PlaybackType.Melody;
const fullStringScaleType = PlaybackType.FullStringScale;

interface PlayButtonProps {
  onPlayExample?: (params: PlayExampleParameters) => Promise<void>;
}

let isCurrentlyPlaying: boolean;
const getIsCurrentlyPlaying = () => {
  return isCurrentlyPlaying === true;
};

export const BasePlayButton: React.FC<PlayButtonProps> = ({
  onPlayExample,
}) => {
  const {
    neck,
    tuning,
    baseNote,
    scale,
    scaleGroup,
    chordsMap,
    playbackType,
    instrument,
    reverbStrength,
    velocity,
    tempoBpm,
  } = useSelector(selectSettings);

  const [isPlaying, setIsPlaying] = useState(false); // State to track if playback is active
  const [isWaiting, setIsWaiting] = useState(false); // State to track if playback is active
  const dispatch = useDispatch();

  const waitForProperStartTime = async () => {
    if (isMetronomeTicking) {
      console.log("Waiting for the next beat");
      await waitForNextBeat();
    } else {
      console.log("Waiting for the next tick");
      await waitForNextTick();
    }

    setIsWaiting(false);
    setIsPlaying(true);
  };

  const getPlayParams = useCallback(
    (): PlayParams => ({
      instrument,
      reverbStrength,
      tempoBpm,
      velocity: velocityValue ?? velocity,
    }),
    [instrument, reverbStrength, tempoBpm, velocity]
  );

  const handlePlay = useCallback(async () => {
    if (!neck) {
      return;
    }
    if (isCurrentlyPlaying) {
      // If already playing, stop playback
      setIsPlaying(false);
      isCurrentlyPlaying = false;
      return;
    }
    setIsWaiting(true);
    isCurrentlyPlaying = true;

    let examples: Example[] | undefined;
    let playWholeScale;
    if (onPlayExample) {
      const { getScaleExamples } = await import("@/app/data/scaleExamples");
      examples = await getScaleExamples(scaleGroup, scale, reverbStrength);
    } else {
      await import("@/app/engine/player");
    }

    // the instrument should be initialized before waiting for the first note
    await initSoundfont(instrument, reverbStrength);
    // init metronome here as we don't want to get glitches if it gets turned on during playing
    await initMetronome();
    ReactGA.event({
      category: "Playback",
      action: "Playback started",
    });

    // Start playback
    await waitForProperStartTime();
    try {
      console.log("Start playing");
      const dispatchAlert = (message: string) =>
        dispatch(setAndShowAlert({ message, isError: false }));
      if (onPlayExample && examples && playbackType === melodyType) {
        await onPlayExample({
          baseNote,
          examples,
          waitNote: waitForNextTick,
          playParams: getPlayParams(),
          neck,
          tuning: parseStringToNotes(tuning),
          isCurrentlyPlaying: getIsCurrentlyPlaying,
          showAlert: dispatchAlert,
          setTempo: (x: number) => dispatch(setTempoBpm(x)),
        });
      } else {
        const isFullStringScalePlayback = playbackType === fullStringScaleType;
        dispatchAlert(
          `${getNoteText(baseNote)} ${scale} ${
            isFullStringScalePlayback ? " (full string)" : ""
          }`
        );

        const { playWholeScale } = await import("@/app/engine/player");
        await playWholeScale(
          waitForNextTick,
          neck,
          getPlayParams(),
          getIsCurrentlyPlaying,
          isFullStringScalePlayback
        );
      }
    } finally {
      setIsPlaying(false);
      isCurrentlyPlaying = false;
    }
  }, [
    baseNote,
    dispatch,
    instrument,
    neck,
    onPlayExample,
    getPlayParams,
    playbackType,
    reverbStrength,
    scale,
    scaleGroup,
    tuning,
  ]);

  useEffect(() => {
    setIsPlaying(false);
    isCurrentlyPlaying = false;
  }, [neck, tuning, baseNote, scale, playbackType]);

  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      if (event.code === "Space") {
        // Call your function here
        handlePlay();
      }
    };

    // Add event listener when the component mounts
    document.addEventListener("keydown", handleKeyPress);

    // Remove event listener when the component unmounts
    return () => {
      document.removeEventListener("keydown", handleKeyPress);
    };
  }, [handlePlay]); // Empty dependency array ensures that this effect runs only once, similar to componentDidMount

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
          ? "Waiting for the next beat..."
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
