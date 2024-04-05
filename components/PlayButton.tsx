import React, { useEffect, useRef, useState } from "react";
import { playExample, playWholeScale } from "../engine/player";
import {
  examplesForScale,
  neck,
  playIntervalMsValue,
} from "../store/controlPanelSlice";
import { useAppSelector } from "../store/store";
import IconButton from "./IconButton";

export const PlayButton: React.FC = () => {
  const { selectedBaseNote, selectedScale, playIntervalMs } = useAppSelector(
    (state) => state.controlPanel
  );
  if (!neck) {
    return "Loading...";
  }

  // We are taking value from a variable to be able to adjust it while playing, but the initial value comes from the store in order to use redux-persist and restore previous value
  const waitInterval = playIntervalMsValue ?? playIntervalMs;
  const [isPlaying, setIsPlaying] = useState(false); // State to track if playback is active
  const isPlayingRef = useRef(false);
  useEffect(() => {
    setIsPlaying(false);
    isPlayingRef.current = false;
  }, [neck, selectedBaseNote, selectedScale]);

  const handlePlay = async () => {
    if (!neck) {
      return;
    }
    if (isPlayingRef.current) {
      // If already playing, stop playback
      setIsPlaying(false);
      isPlayingRef.current = false;
      return;
    }

    // Start playback
    setIsPlaying(true);
    isPlayingRef.current = true;

    if (examplesForScale) {
      await playExample(examplesForScale, waitInterval, neck, isPlayingRef);
    } else {
      await playWholeScale(waitInterval, neck, isPlayingRef);
    }
    setIsPlaying(false);
    isPlayingRef.current = false;
  };
  return <IconButton icon={isPlaying ? "⏸️" : "▶️"} onPress={handlePlay} />;
};
