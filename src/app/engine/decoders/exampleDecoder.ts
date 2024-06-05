import { Example } from "@/app/data/example";
import { parseStringToNotes } from "@/app/data/tunings";
import { EventsByTick } from "@/app/engine/eventsByTick";
import { MelodyDecoder } from "./melodyDecoder";

export const decodeExample = (example: Example) => {
  if (example.decodedTracks) {
    return example.decodedTracks;
  }

  const allDecodedTracks = example.tracks.map((track, trackNumber) => {
    return new MelodyDecoder(
      { ...track, trackNumber },
      parseStringToNotes(example.tuning ?? "EBGDAE")
    ).decodeMelody();
  });
  const merged = EventsByTick.merge(...allDecodedTracks);
  example.decodedTracks = merged;
  return merged;
};
