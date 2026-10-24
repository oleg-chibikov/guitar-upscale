import { Example, getExampleName } from "@/app/data/example";
import { EventsByTick } from "@/app/engine/eventsByTick";
import { usePianoRollData } from "@/app/hooks/usePianoRollData";
import { useEffect, useState } from "react";

export type LoadedSong = {
  data: EventsByTick;
  example: Example;
  // read again on each library change, since a rename changes the example in place
  name: string;
};

/**
 * The song from the song list that plays or waits to play. A scale or a melody outside the list gives undefined
 */
export const useLoadedSong = (): LoadedSong | undefined => {
  const data = usePianoRollData();
  const [song, setSong] = useState<LoadedSong>();

  useEffect(() => {
    let active = true;
    let unsubscribe: (() => void) | undefined;
    if (!data) {
      return;
    }
    void import("@/app/engine/songs/songLibrary").then(
      ({ getExampleForEvents, subscribeToLibrary }) => {
        if (!active) {
          return;
        }
        const update = () => {
          const example = getExampleForEvents(data);
          setSong(example && { data, example, name: getExampleName(example) });
        };
        unsubscribe = subscribeToLibrary(update);
        update();
      },
    );
    return () => {
      active = false;
      unsubscribe?.();
    };
  }, [data]);

  return song?.data === data ? song : undefined;
};
