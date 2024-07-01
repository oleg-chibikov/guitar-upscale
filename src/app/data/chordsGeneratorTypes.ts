import { ChordMode, ChordModeVariationsContainer } from "@/app/data/chordModes";
import { Neck } from "@/app/engine/generateNeckRepresentation";

export type WithGenerationId = {
  generationId: number;
};

export type GenerateChordsRequest = WithGenerationId & {
  neck: Neck;
  capo: number;
  chordModes: ChordMode[];
};

export type GenerateChordsWorkerMessage =
  | ({
      type: "start";
    } & GenerateChordsRequest)
  | ({ type: "abort" } & WithGenerationId);

export type GenerateChordsCallback = {
  chordModeVariationsContainer: ChordModeVariationsContainer;
  index: number;
};

export type GenerateChordsCallbackMessage =
  | ({
      type: "chordModeProcessed";
    } & GenerateChordsCallback)
  | { type: "processingComplete" }
  | { type: "processingAborted" };

export type WorkerMessageWrapper<T> = {
  data: T;
};
