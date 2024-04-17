import Pause from "@mui/icons-material/Pause";
import PlayArrow from "@mui/icons-material/PlayArrow";
import React, { useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { getNoteText, parseStringToNotes } from "../../../data/notes";
import { playExample, playWholeScale } from "../../../engine/player";
import { sleep } from "../../../engine/sleep";
import {
  PlaybackType,
  examplesForScale,
  playIntervalBpmValue,
  selectControlPanel,
  showAlert,
} from "../../../store/controlPanelSlice";
import { IconButton } from "./IconButton";
const melodyType = PlaybackType.Melody;
const fullStringScaleType = PlaybackType.FullStringScale;

export const PlayButton: React.FC = (props) => {
  const {
    neck,
    tuning,
    baseNote,
    scale,
    playIntervalBpm,
    chordsMap,
    playbackType,
  } = useSelector(selectControlPanel);

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

    const bpmToMilliseconds = (bpm: number): number => {
      return 60000 / bpm / 2;
    };

    const waitNote = async () => {
      // We are taking value from a variable to be able to adjust it while playing, but the initial value comes from the store in order to use redux-persist and restore previous value
      const waitBpm = playIntervalBpmValue ?? playIntervalBpm;
      const waitMs = bpmToMilliseconds(waitBpm);

      await sleep(waitMs);
    };

    const dispatchAlert = (message: string) => dispatch(showAlert(message));

    if (playbackType === melodyType && examplesForScale) {
      await playExample(
        baseNote,
        examplesForScale,
        waitNote,
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
        waitNote,
        neck,
        isPlayingRef,
        isFullStringScalePlayback
      );
    }
    setIsPlaying(false);
    isPlayingRef.current = false;
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
