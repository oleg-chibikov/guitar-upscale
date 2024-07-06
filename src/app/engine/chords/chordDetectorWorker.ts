import {
  ChordDetectorCallbackData,
  ChordDetectorCallbackMessage,
  ChordDetectorWorkerMessage,
} from "@/app/data/chordDetectorWorkerTypes";
import { ChordModeVariations, getModeText } from "@/app/data/chordModes";
import { getNoteText } from "@/app/data/notes";
import { WorkerMessageWrapper } from "@/app/data/workerTypes";
import { chordDetector } from "@/app/engine/chords/chordDetector";
import { getSlashChordsForVariation } from "@/app/engine/chords/slashChordGenerator";

import { Neck } from "@/app/engine/generateNeckRepresentation";

let neckValue: Neck | null = null;
let capoValue: number = 0;

const addChordsToDetectorLookup = (
  chordModeVariations: ChordModeVariations
) => {
  const modeKey = getModeText(chordModeVariations.chordMode);
  chordModeVariations.variationsByNote.forEach((variationsForNote, note) => {
    const fullKey = getNoteText(note) + modeKey;
    variationsForNote?.forEach((variation) => {
      chordDetector.addChordToDetectorLookup(variation, fullKey);
      const slashChordsGenerator = getSlashChordsForVariation(
        variation,
        neckValue!,
        capoValue
      );
      let result = slashChordsGenerator.next();

      while (!(result.done ?? false)) {
        const slashChord = result.value;
        if (slashChord) {
          chordDetector.addChordToDetectorLookup!(
            slashChord.variation,
            `${fullKey}/${getNoteText(slashChord.bassNote.note)}`
          );
        }
        result = slashChordsGenerator.next();
      }
    });
  });
};

const setNeckAndCapo = (neck: Neck, value: number) => {
  neckValue = neck;
  capoValue = value;
};

self.onmessage = (
  event: MessageEvent<WorkerMessageWrapper<ChordDetectorWorkerMessage>>
) => {
  const { type, payload } = event.data.data;

  switch (type) {
    case "addChordsToDetectorLookup":
      addChordsToDetectorLookup(payload.chordModeVariations);
      break;
    case "findMatches": {
      const { notes } = payload;
      chordDetector.findMatches(notes, (data: ChordDetectorCallbackData) => {
        const message: WorkerMessageWrapper<ChordDetectorCallbackMessage> = {
          data: { type: "findMatchesResult", payload: data },
        };
        self.postMessage(message);
      });
      break;
    }
    case "setNeckAndCapo":
      setNeckAndCapo(payload.neck, payload.capoValue);
      break;
    default:
      console.error("Unknown message type:", type);
  }
};
