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
