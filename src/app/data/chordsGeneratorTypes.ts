import { ChordMode, ChordModeVariations } from "@/app/data/chordModes";
import { Neck } from "@/app/data/notes";

export const MAX_STRING_INDEX_FOR_CHORD_GENERATION = 5;
export const MAX_DISTANCE_IN_CHORD = 5; // a guitarist shouldn't span the chord for more than 5 frets

export type GenerateChordsRequest = {
  neck: Neck;
  capo: number;
  chordModes: ChordMode[];
};

export type GenerateChordsWorkerMessage =
  | {
      type: "start";
    } & GenerateChordsRequest;

export type GenerateChordsCallback = {
  chordModeVariations: ChordModeVariations;
  index: number;
};

export type GenerateChordsCallbackMessage =
  | ({
      type: "chordModeProcessed";
    } & GenerateChordsCallback)
  | { type: "processingComplete" };
