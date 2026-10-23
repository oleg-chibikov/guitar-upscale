import { Example } from "@/app/data/example";
import { SongDecoder } from "./songDecoder";

export const decodeExample = async (example: Example) => {
  if (example.decodedTracks) {
    return example.decodedTracks;
  }
  example.song ??= await example.load();
  example.decodedTracks = await new SongDecoder(example.song).decode();
  return example.decodedTracks;
};
