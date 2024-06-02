import { PlayExampleParameters } from "@/app/data/playExampleParameters";
import { parseStringToNotes } from "@/app/data/tunings";
import { EventsByTick } from "@/app/engine/eventsByTick";
import { decodeMelody } from "./melodyDecoder";

export const decodeExample = ({ example, neck }: PlayExampleParameters) => {
  if (example.decodedTracks) {
    return example.decodedTracks;
  }

  const allDecodedTracks = example.tracks.map((track, trackNumber) => {
    return decodeMelody(
      { ...track, trackNumber },
      neck,
      parseStringToNotes(example.tuning ?? "EBGDAE")
    );
  });
  const merged = EventsByTick.merge(...allDecodedTracks);
  example.decodedTracks = merged;
  return merged;
};
