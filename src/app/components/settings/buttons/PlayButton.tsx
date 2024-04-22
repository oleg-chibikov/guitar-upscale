"use client";
import { getNoteText, parseStringToNotes } from "@/app/data/notes";
import { PlayExampleParameters } from "@/app/engine/examplePlayer";
import { waitForNextBeat, waitForNextTick } from "@/app/engine/mainClock";
import HourglassTopIcon from "@mui/icons-material/HourglassTop";
import Pause from "@mui/icons-material/Pause";
import PlayArrow from "@mui/icons-material/PlayArrow";
import React, { useCallback, useEffect, useState } from "react";
import ReactGA from "react-ga4";
import { useDispatch, useSelector } from "react-redux";
import {
  PlaybackType,
  isMetronomeTicking,
  selectControlPanel,
  setAndShowAlert,
  setTempoBpm,
} from "../../../store/controlPanelSlice";
import { IconButton } from "./IconButton";

const melodyType = PlaybackType.Melody;
const fullStringScaleType = PlaybackType.FullStringScale;

interface PlayButtonProps {
  onPlayExample?: (params: PlayExampleParameters) => Promise<boolean>;
}

let isCurrentlyPlaying: boolean;
const getIsCurrentlyPlaying = () => {
  return isCurrentlyPlaying === true;
};

export const BasePlayButton: React.FC<PlayButtonProps> = ({
  onPlayExample,
}) => {
  const { neck, tuning, baseNote, scale, scaleGroup, chordsMap, playbackType } =
    useSelector(selectControlPanel);

  const [isPlaying, setIsPlaying] = useState(false); // State to track if playback is active
  const [isWaiting, setIsWaiting] = useState(false); // State to track if playback is active
  const dispatch = useDispatch();

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

    ReactGA.event({
      category: "Playback",
      action: "Playback started",
    });

    // Start playback
    setIsWaiting(true);
    isCurrentlyPlaying = true;

    if (isMetronomeTicking) {
      await waitForNextBeat();
    }

    setIsWaiting(false);
    setIsPlaying(true);
    try {
      console.log("Start playing");
      const dispatchAlert = (message: string) =>
        dispatch(setAndShowAlert({ message, isError: false }));
      let examplePlayed: boolean = false;
      if (onPlayExample && playbackType === melodyType) {
        const params: PlayExampleParameters = {
          baseNote,
          scaleGroup,
          scale,
          waitNote: waitForNextTick,
          neck,
          tuning: parseStringToNotes(tuning),
          isCurrentlyPlaying: getIsCurrentlyPlaying,
          showAlert: dispatchAlert,
          setTempo: (x: number) => dispatch(setTempoBpm(x)),
        };
        examplePlayed = await onPlayExample(params);
      }

      if (!examplePlayed) {
        const isFullStringScalePlayback = playbackType === fullStringScaleType;
        dispatchAlert(
          `${getNoteText(baseNote)} ${scale} ${
            isFullStringScalePlayback ? " (full string)" : ""
          }`
        );
        const playWholeScale = (await import("@/app/engine/player"))
          .playWholeScale;
        await playWholeScale(
          waitForNextTick,
          neck,
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
    neck,
    onPlayExample,
    playbackType,
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
