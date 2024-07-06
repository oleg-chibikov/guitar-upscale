import { ChordMode, ChordModeVariationsContainer } from "@/app/data/chordModes";
import { Neck } from "@/app/engine/generateNeckRepresentation";

export const MAX_STRING_INDEX_FOR_CHORD_GENERATION = 5;

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
  chordModeVariationsContainer: ChordModeVariationsContainer;
  index: number;
};

export type GenerateChordsCallbackMessage =
  | ({
      type: "chordModeProcessed";
    } & GenerateChordsCallback)
  | { type: "processingComplete" };
