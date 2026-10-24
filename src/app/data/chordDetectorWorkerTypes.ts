import { AlertType } from "@/app/data/alertType";
import { ChordModeVariations } from "@/app/data/chordModes";
import { Neck, StringOctaveNote } from "@/app/data/notes";

export const MIN_NOTES_TO_DETECT_CHORD = 3;
export type ChordDetectorCallbackData =
  | {
      text: string;
      alertType?: AlertType;
      chords?: undefined;
    }
  | {
      chords: string[];
      text?: undefined;
      alertType?: undefined;
    };

export type AddChordsToDetectorLookupRequest = {
  chordModeVariations: ChordModeVariations;
};

export type FindMatchesRequest = {
  requestId: number;
  notes: StringOctaveNote[];
};

export type SetNeckAndCapoRequest = {
  neck: Neck;
  capoValue: number;
};

export type ChordDetectorWorkerMessage =
  | {
      type: "addChordsToDetectorLookup";
      payload: AddChordsToDetectorLookupRequest;
    }
  | {
      type: "findMatches";
      payload: FindMatchesRequest;
    }
  | {
      type: "setNeckAndCapo";
      payload: SetNeckAndCapoRequest;
    };

export type ChordDetectorCallbackMessage = {
  type: "findMatchesResult";
  requestId: number;
  payload: ChordDetectorCallbackData;
};
