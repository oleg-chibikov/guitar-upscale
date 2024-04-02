import React, { useEffect, useRef, useState } from "react";
import { Pressable, Text } from "react-native";
import { useDispatch } from "react-redux";
import { setNoteToAnimate } from "../store/controlPanelSlice";
import { useAppSelector } from "../store/store";
import tw from "../tailwind";

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export const Play: React.FC = () => {
  const { neck, selectedBaseNote, selectedScale } = useAppSelector(
    (state) => state.controlPanel
  );
  if (!neck) {
    return "Loading...";
  }
  const [isPlaying, setIsPlaying] = useState(false); // State to track if playback is active
  const isPlayingRef = useRef(false);
  useEffect(() => {
    setIsPlaying(false);
    isPlayingRef.current = false;
  }, [neck, selectedBaseNote, selectedScale]);
  const dispatch = useDispatch();

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
    var neckCopy = [...neck];
    if (reverseNeck) {
      neckCopy.reverse();
    }

    for (const string of neckCopy) {
      const stringCopy = [...string];
      if (reverseString) {
        stringCopy.reverse();
      }
      for (const note of stringCopy.filter((x) => x)) {
        // Check if playback should be stopped
        if (!isPlayingRef.current) {
          break;
        }
        if (note) {
          dispatch(setNoteToAnimate(note));
        }
        await sleep(100);
      }
    }
    setIsPlaying(false);
    isPlayingRef.current = false;
  };
  return (
    <Pressable
      style={tw`flex items-center w-7 h-7 justify-center`}
      onPress={handlePlay}
    >
      <Text style={tw`text-2xl`}>{isPlaying ? "⏸️" : "▶️"}</Text>
    </Pressable>
  );
};
