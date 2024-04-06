import React, { useEffect, useRef, useState } from "react";
import { useDispatch } from "react-redux";
import { playExample, playWholeScale } from "../engine/player";
import {
  examplesForScale,
  playIntervalBpmValue,
  showAlert,
} from "../store/controlPanelSlice";
import { useAppSelector } from "../store/store";
import IconButton from "./IconButton";

export const PlayButton: React.FC = () => {
  const { neck, selectedBaseNote, selectedScale, playIntervalBpm } =
    useAppSelector((state) => state.controlPanel);
  if (!neck) {
    return "Loading...";
  }

  const [isPlaying, setIsPlaying] = useState(false); // State to track if playback is active
  const isPlayingRef = useRef(false);
  const dispatch = useDispatch();

  useEffect(() => {
    setIsPlaying(false);
    isPlayingRef.current = false;
  }, [neck, selectedBaseNote, selectedScale]);

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

    const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

    const bpmToMilliseconds = (bpm: number): number => {
      return 60000 / bpm / 2;
    };

    const wait = async () => {
      // We are taking value from a variable to be able to adjust it while playing, but the initial value comes from the store in order to use redux-persist and restore previous value
      const waitBpm = playIntervalBpmValue ?? playIntervalBpm;
      const waitMs = bpmToMilliseconds(waitBpm);

      await sleep(waitMs);
    };

    if (examplesForScale) {
      await playExample(
        selectedBaseNote,
        examplesForScale,
        wait,
        neck,
        isPlayingRef,
        (message) => dispatch(showAlert(message))
      );
    } else {
      await playWholeScale(wait, neck, isPlayingRef);
    }
    setIsPlaying(false);
    isPlayingRef.current = false;
  };
  return <IconButton icon={isPlaying ? "⏸️" : "▶️"} onPress={handlePlay} />;
};
