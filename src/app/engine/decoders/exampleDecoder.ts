import { Example } from "@/app/data/example";
import { bindExampleEvents } from "@/app/engine/songs/songLibrary";
import { SongDecoder } from "./songDecoder";

export const decodeExample = async (example: Example) => {
  if (example.decodedTracks) {
    return example.decodedTracks;
  }
  example.song ??= await example.load();
  example.decodedTracks = await new SongDecoder(example.song).decode();
  bindExampleEvents(example, example.decodedTracks);
  return example.decodedTracks;
};
