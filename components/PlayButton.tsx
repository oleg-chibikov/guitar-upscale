import React, { useEffect, useRef, useState } from "react";
import {
  OctaveNote,
  StringOctaveNote,
  serizlizeOctaveNote,
} from "../data/notes";
import { NotePlayEventBus } from "../engine/eventBus";
import { playIntervalMsValue } from "../store/controlPanelSlice";
import { useAppSelector } from "../store/store";
import IconButton from "./IconButton";

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export const PlayButton: React.FC = () => {
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

    const reverse = Math.random() < 0.5;
    var neckCopy = [...neck];
    if (reverse) {
      neckCopy.reverse();
    }

    // usaed to be stored in StringOctaveNotes
    let realStringIndex = reverse ? neckCopy.length - 1 : 0;
    let orderedStringIndex = 0;
    for (const string of neckCopy) {
      // Check if playback should be stopped
      if (!isPlayingRef.current) {
        break;
      }
      const stringCopy = [...string]
        .filter((x) => x)
        .map((note) => ({
          ...note,
          string: realStringIndex,
        })) as StringOctaveNote[];

      realStringIndex = reverse ? realStringIndex - 1 : realStringIndex + 1; //incrementing string index here
      orderedStringIndex++;

      if (!reverse) {
        stringCopy.reverse();
      }

      const nextString =
        orderedStringIndex < neckCopy.length
          ? neckCopy[orderedStringIndex]
          : undefined;

      let boundaryNote: string | undefined = undefined;
      if (nextString !== undefined) {
        const trimmedString = nextString.filter((x) => x) as OctaveNote[];
        const firstOrLastIndex = !reverse ? trimmedString.length - 1 : 0;
        const firstOrLastNoteOfNextString = trimmedString[firstOrLastIndex];
        boundaryNote = serizlizeOctaveNote(firstOrLastNoteOfNextString);
      }

      for (const note of stringCopy) {
        // Check if playback should be stopped
        if (!isPlayingRef.current) {
          break;
        }

        if (boundaryNote) {
          const serializedNote = serizlizeOctaveNote(note);

          if (serializedNote === boundaryNote) {
            // going to the next string when the note repeats
            break;
          }
        }

        console.log("Requesting auto play note: " + JSON.stringify(note));
        NotePlayEventBus.next(note);
        await sleep(playIntervalMsValue);
      }
    }
    setIsPlaying(false);
    isPlayingRef.current = false;
  };
  return <IconButton icon={isPlaying ? "⏸️" : "▶️"} onPress={handlePlay} />;
};
