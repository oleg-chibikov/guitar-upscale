import {
  ChordDetectorCallbackData,
  ChordDetectorCallbackMessage,
  ChordDetectorWorkerMessage,
} from "@/app/data/chordDetectorWorkerTypes";
import { ChordModeVariations } from "@/app/data/chordModes";
import { Chord, Neck, StringOctaveNote } from "@/app/data/notes";
import { WorkerMessageWrapper } from "@/app/data/workerTypes";

const worker = new Worker(
  new URL("./detectorWorker/chordDetectorWorker.ts", import.meta.url),
);

class ChordDetectorWorkerApi {
  addChordsToDetectorLookup(chordModeVariations: ChordModeVariations): void {
    // Finger layouts of one voicing share the variation array. The detector needs each voicing once.
    const seenVariations = new Set<Chord>();
    const message: WorkerMessageWrapper<ChordDetectorWorkerMessage> = {
      data: {
        type: "addChordsToDetectorLookup",
        payload: {
          chordModeVariations: {
            ...chordModeVariations,
            variationsByNote: chordModeVariations.variationsByNote.map(
              (variations) =>
                variations?.filter(({ variation }) => {
                  if (seenVariations.has(variation)) {
                    return false;
                  }
                  seenVariations.add(variation);
                  return true;
                }),
            ),
          },
        },
      },
    };
    worker.postMessage(message);
  }

  findMatches(
    notes: StringOctaveNote[],
    callback: (data: ChordDetectorCallbackData) => void,
  ): Promise<ChordDetectorCallbackData> {
    return new Promise((resolve) => {
      const handleMessage = (
        event: MessageEvent<WorkerMessageWrapper<ChordDetectorCallbackMessage>>,
      ) => {
        const { type, payload } = event.data.data;
        if (type === "findMatchesResult") {
          callback(payload);
          resolve(payload);
          worker.removeEventListener("message", handleMessage);
        }
      };

      worker.addEventListener("message", handleMessage);
      const message: WorkerMessageWrapper<ChordDetectorWorkerMessage> = {
        data: { type: "findMatches", payload: { notes } },
      };
      worker.postMessage(message);
    });
  }

  setNeckAndCapo(neck: Neck, capoValue: number): void {
    const message: WorkerMessageWrapper<ChordDetectorWorkerMessage> = {
      data: { type: "setNeckAndCapo", payload: { neck, capoValue } },
    };
    worker.postMessage(message);
  }
}

export const chordDetectorWorkerApi = new ChordDetectorWorkerApi();
