import { getNoteText, parseStringToNotes } from "@/app/data/notes";
import { waitForNextBeat, waitForNextTick } from "@/app/engine/mainClock";
import { playExample, playWholeScale } from "@/app/engine/player";
import Pause from "@mui/icons-material/Pause";
import PlayArrow from "@mui/icons-material/PlayArrow";
import React, { useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  PlaybackType,
  examplesForScale,
  selectControlPanel,
  showAlert,
} from "../../../store/controlPanelSlice";
import { IconButton } from "./IconButton";
const melodyType = PlaybackType.Melody;
const fullStringScaleType = PlaybackType.FullStringScale;

export const PlayButton: React.FC = (props) => {
  const { neck, tuning, baseNote, scale, chordsMap, playbackType } =
    useSelector(selectControlPanel);

  const [isPlaying, setIsPlaying] = useState(false); // State to track if playback is active
  const isPlayingRef = useRef(false);
  const dispatch = useDispatch();

  useEffect(() => {
    setIsPlaying(false);
    isPlayingRef.current = false;
  }, [neck, tuning, baseNote, scale, playbackType]);

  if (!neck) {
    return null;
  }
  if (!chordsMap) {
    return null;
  }

  const handlePlay = async () => {
    if (isPlayingRef.current) {
      // If already playing, stop playback
      setIsPlaying(false);
      isPlayingRef.current = false;
      return;
    }

    // Start playback
    setIsPlaying(true);
    isPlayingRef.current = true;

    await waitForNextBeat();

    try {
      console.log("Start playing");
      const dispatchAlert = (message: string) => dispatch(showAlert(message));
      if (playbackType === melodyType && examplesForScale) {
        await playExample(
          baseNote,
          examplesForScale,
          waitForNextTick,
          neck,
          parseStringToNotes(tuning),
          isPlayingRef,
          dispatchAlert
        );
      } else {
        const isFullStringScalePlayback = playbackType === fullStringScaleType;
        dispatchAlert(
          `${getNoteText(baseNote)} ${scale} ${
            isFullStringScalePlayback ? " (full string)" : ""
          }`
        );
        await playWholeScale(
          waitForNextTick,
          neck,
          isPlayingRef,
          isFullStringScalePlayback
        );
      }
    } finally {
      setIsPlaying(false);
      isPlayingRef.current = false;
    }
  };

  return (
    <IconButton
      {...props}
      isActive={isPlaying}
      tooltip={isPlaying ? "Stop playing scale" : "Play scale"}
      icon={isPlaying ? <Pause /> : <PlayArrow />}
      onPress={handlePlay}
    />
  );
};
