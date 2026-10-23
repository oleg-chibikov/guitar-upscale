import { EventsByTick } from "@/app/engine/eventsByTick";
import { Song } from "./song";

export type Example = {
  id: string;
  band: string;
  title: string;
  scaleGroup: string;
  scale: string;
  // uploaded by the person, as opposed to the songs that come with the app
  isUserSong: boolean;
  load: () => Promise<Song>;
  song?: Song;
  decodedTracks?: EventsByTick;
};

export type ExamplesMap = Map<string, Map<string, Example[]>>;

export const getExampleName = (example: Pick<Example, "band" | "title">) =>
  [example.band, example.title].filter(Boolean).join(" - ");

// Every word of the query has to appear somewhere in the name or the scale.
export const matchesExampleSearch = (
  example: Pick<Example, "band" | "title" | "scale" | "scaleGroup">,
  query: string,
) => {
  const words = query.toLowerCase().split(/\s+/).filter(Boolean);
  const text = [getExampleName(example), example.scale, example.scaleGroup]
    .join(" ")
    .toLowerCase();
  return words.every((word) => text.includes(word));
};
