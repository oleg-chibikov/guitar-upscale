import React, { useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { getNoteText } from "../../../data/notes";
import { playExample, playWholeScale } from "../../../engine/player";
import { sleep } from "../../../engine/sleep";
import {
  PlaybackType,
  examplesForScale,
  playIntervalBpmValue,
  selectControlPanel,
  showAlert,
} from "../../../store/controlPanelSlice";
import { IconButton, IconButtonProps } from "../../IconButton";
const melodyType = PlaybackType.Melody;
const fullStringScaleType = PlaybackType.FullStringScale;

export const PlayButton: React.FC<Omit<IconButtonProps, "onPress" | "icon">> = (
  props
) => {
  const {
    neck,
    selectedBaseNote,
    selectedScale,
    playIntervalBpm,
    playbackType,
  } = useSelector(selectControlPanel);

  const [isPlaying, setIsPlaying] = useState(false); // State to track if playback is active
  const isPlayingRef = useRef(false);
  const dispatch = useDispatch();

  useEffect(() => {
    setIsPlaying(false);
    isPlayingRef.current = false;
  }, [neck, selectedBaseNote, selectedScale, playbackType]);

  if (!neck) {
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

    const wait = async () => {
      // We are taking value from a variable to be able to adjust it while playing, but the initial value comes from the store in order to use redux-persist and restore previous value
      const waitBpm = playIntervalBpmValue ?? playIntervalBpm;
      const waitMs = bpmToMilliseconds(waitBpm);

      await sleep(waitMs);
    };

    const dispatchAlert = (message: string) => dispatch(showAlert(message));

    if (playbackType === melodyType && examplesForScale) {
      await playExample(
        selectedBaseNote,
        examplesForScale,
        wait,
        neck,
        isPlayingRef,
        dispatchAlert
      );
    } else {
      const isFullStringScalePlayback = playbackType === fullStringScaleType;
      dispatchAlert(
        `${getNoteText(selectedBaseNote)} ${selectedScale} ${
          isFullStringScalePlayback ? " (full string)" : ""
        }`
      );
      await playWholeScale(wait, neck, isPlayingRef, isFullStringScalePlayback);
    }
    setIsPlaying(false);
    isPlayingRef.current = false;
  };
  return (
    <IconButton
      {...props}
      icon={isPlaying ? "⏸️" : "▶️"}
      onPress={handlePlay}
    />
  );
};
