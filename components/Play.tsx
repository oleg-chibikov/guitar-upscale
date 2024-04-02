import React, { useEffect, useRef, useState } from "react";
import { Button } from "react-native";
import { Neck } from "../engine/generateNeckRepresentation";
import { playNote } from "../engine/soundProvider";

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

interface PlayProps {
  neck: Neck;
  stopSignal: unknown;
}

export const Play: React.FC<PlayProps> = ({ neck, stopSignal }) => {
  const [isPlaying, setIsPlaying] = useState(false); // State to track if playback is active
  const isPlayingRef = useRef(false);
  useEffect(() => {
    setIsPlaying(false);
    isPlayingRef.current = false;
  }, [stopSignal]);

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

    const reverseString = Math.random() < 0.5;
    const reverseNeck = Math.random() < 0.5;

    for (const string of reverseNeck ? neck : neck.reverse()) {
      for (const note of (reverseString ? string : string.reverse()).filter(
        (x) => x
      )) {
        // Check if playback should be stopped
        if (!isPlayingRef.current) {
          break;
        }
        playNote(note!);
        await sleep(100);
      }
    }
    setIsPlaying(false);
    isPlayingRef.current = false;
  };
  return <Button onPress={handlePlay} title={isPlaying ? "⏸️" : "▶️"} />;
};
