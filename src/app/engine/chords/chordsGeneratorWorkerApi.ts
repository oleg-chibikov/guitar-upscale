import {
  advancedChordModes,
  chordModes,
  ChordModeVariations,
} from "@/app/data/chordModes";
import {
  GenerateChordsCallbackMessage,
  GenerateChordsWorkerMessage,
} from "@/app/data/chordsGeneratorTypes";
import { Neck } from "@/app/data/notes";
import { WorkerMessageWrapper } from "@/app/data/workerTypes";

let workers: Worker[] = [];
let isGenerating = false;
let chordsWaitResolve: (() => void) | undefined;

// One core stays free for the UI thread.
const WORKER_COUNT = Math.max(
  1,
  Math.min(
    4,
    (typeof navigator === "undefined" ? 2 : navigator.hardwareConcurrency || 2) -
      1
  )
);

// A worker takes hundreds of milliseconds to start, so the pool starts early and stays alive between generations.
const startWorkers = () => {
  if (typeof Worker === "undefined") {
    return;
  }
  while (workers.length < WORKER_COUNT) {
    workers.push(
      new Worker(
        new URL("./generatorWorker/chordsGeneratorWorker.ts", import.meta.url)
      )
    );
  }
};

startWorkers();

export const setPromiseToResolveWhenChordsAreLoaded = (
  resolve: () => void | undefined
) => {
  chordsWaitResolve = resolve;
};

export const abortGeneratingChords = () => {
  if (!isGenerating) {
    return;
  }
  console.log("Terminate workers");
  workers.forEach((worker) => worker.terminate());
  workers = [];
  isGenerating = false;
  startWorkers();
};

export const generateChords = (
  neck: Neck,
  capo: number,
  onChordModeProcessed: (chordModeVariations: ChordModeVariations) => void,
  onComplete: () => void
) => {
  console.log("Start generating chords");

  const allModes = [...chordModes, ...advancedChordModes];
  // Modes finish out of order across workers. They wait here so the callers get them in list order.
  const finished: (ChordModeVariations | null | undefined)[] = new Array(
    allModes.length
  );
  let nextModeToSend = 0;
  let nextModeToEmit = 0;

  const emitFinishedModesInOrder = () => {
    while (
      nextModeToEmit < allModes.length &&
      finished[nextModeToEmit] !== undefined
    ) {
      const chordModeVariations = finished[nextModeToEmit];
      finished[nextModeToEmit] = undefined;
      nextModeToEmit++;
      if (chordModeVariations) {
        onChordModeProcessed(chordModeVariations);
      }
    }

    if (nextModeToEmit === allModes.length && isGenerating) {
      console.log("All chord modes have been processed");
      isGenerating = false;
      onComplete();
      chordsWaitResolve?.();
      chordsWaitResolve = undefined;
    }
  };

  const sendNextMode = (worker: Worker) => {
    if (nextModeToSend >= allModes.length) {
      return undefined;
    }
    const index = nextModeToSend++;
    worker.postMessage({
      type: "start",
      neck,
      capo,
      chordModes: [allModes[index]],
    } as GenerateChordsWorkerMessage);
    return index;
  };

  const startWorker = (worker: Worker) => {
    let currentIndex: number | undefined;

    worker.onmessage = (
      event: WorkerMessageWrapper<GenerateChordsCallbackMessage>
    ) => {
      if (currentIndex === undefined) {
        return;
      }

      switch (event.data.type) {
        case "chordModeProcessed": {
          const { chordModeVariations } = event.data;
          console.log(
            `Chord mode ${chordModeVariations.chordMode.name} (index: ${currentIndex}) has been processed`
          );
          finished[currentIndex] = chordModeVariations;
          break;
        }
        case "processingComplete":
          // null marks a mode the worker skipped because the guitar has too few strings for it
          finished[currentIndex] ??= null;
          currentIndex = sendNextMode(worker);
          emitFinishedModesInOrder();
          break;
      }
    };

    currentIndex = sendNextMode(worker);
  };

  abortGeneratingChords();
  startWorkers();
  isGenerating = true;

  if (allModes.length === 0) {
    emitFinishedModesInOrder();
    return;
  }

  workers.forEach(startWorker);
};
