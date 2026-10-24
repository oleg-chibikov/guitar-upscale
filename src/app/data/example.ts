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

// asks for a random song of the current scale, other than the last one
export const RANDOM_SONG = "random";
export type SongChoice = Example | typeof RANDOM_SONG;

export const getExampleName = (example: Pick<Example, "band" | "title">) =>
  [example.band, example.title].filter(Boolean).join(" - ");

// a song the person makes gets a name they can change later, such as "Recording 24 Oct, 21:58"
export const getNewSongName = (kind: string, date = new Date()) =>
  `${kind} ${date.toLocaleString(undefined, {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  })}`;

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
