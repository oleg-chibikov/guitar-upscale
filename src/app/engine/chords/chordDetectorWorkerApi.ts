import {
  ChordDetectorCallbackData,
  ChordDetectorWorkerMessage,
} from "@/app/data/chordDetectorWorkerTypes";
import { ChordModeVariations } from "@/app/data/chordModes";
import { Chord, Neck, StringOctaveNote } from "@/app/data/notes";
import { WorkerMessageWrapper } from "@/app/data/workerTypes";
import { createWorkerRequests } from "@/app/helpers/workerRequests";

const worker = new Worker(
  new URL("./detectorWorker/chordDetectorWorker.ts", import.meta.url),
);

const request = createWorkerRequests<ChordDetectorCallbackData>(
  worker,
  "findMatchesResult",
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

  async findMatches(
    notes: StringOctaveNote[],
    callback: (data: ChordDetectorCallbackData) => void,
  ): Promise<ChordDetectorCallbackData> {
    const data = await request((requestId) => {
      const message: WorkerMessageWrapper<ChordDetectorWorkerMessage> = {
        data: { type: "findMatches", payload: { requestId, notes } },
      };
      worker.postMessage(message);
    });
    callback(data);
    return data;
  }

  setNeckAndCapo(neck: Neck, capoValue: number): void {
    const message: WorkerMessageWrapper<ChordDetectorWorkerMessage> = {
      data: { type: "setNeckAndCapo", payload: { neck, capoValue } },
    };
    worker.postMessage(message);
  }
}

export const chordDetectorWorkerApi = new ChordDetectorWorkerApi();
