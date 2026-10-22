import {
  ChordMode,
  ChordModeVariations,
  ChordVariationsByNote,
} from "@/app/data/chordModes";
import {
  GenerateChordsCallbackMessage,
  GenerateChordsRequest,
  MAX_STRING_INDEX_FOR_CHORD_GENERATION,
} from "@/app/data/chordsGeneratorTypes";
import { Neck, NOTE_COUNT } from "@/app/data/notes";
import { FretChordsGenerator } from "@/app/engine/chords/generatorWorker/fretChordsGenerator";
import { SharedArrayCache } from "@/app/engine/chords/generatorWorker/sharedArrayCache";

class ChordsGenerator {
  private capo = 0;
  private neck: Neck = [];
  private maxFretToProcess = 0;

  constructor() {
    console.log("Creating ChordGenerator");
  }

  processInWorker({ neck, capo, chordModes }: GenerateChordsRequest): void {
    this.capo = capo;
    this.neck = neck;
    this.maxFretToProcess = Math.min(
      this.capo + NOTE_COUNT,
      neck[0].length - 1
    );

    const chordModesCount = chordModes.length;

    for (let index = 0; index < chordModesCount; index++) {
      const chordMode = chordModes[index];

      if (chordMode.intervals.length > this.neck.length) {
        // cannot build this chord on the given guitar - it has more notes that the strings guitar has
        continue;
      }

      const chordModeVariations = this.processChordMode(chordMode);

      // Post a message for each processed chord mode
      self.postMessage({
        type: "chordModeProcessed",
        chordModeVariations,
        index,
      } as GenerateChordsCallbackMessage);
    }

    console.log("Done processing chords");
    // Post a message when processing is complete
    self.postMessage({
      type: "processingComplete",
    } as GenerateChordsCallbackMessage);
  }

  private buildIntervalsWithoutPerfectFifth = (chordMode: ChordMode) => {
    if (!chordMode.canSkipPerfectFifth) {
      return;
    }
    const intervalsSet = new Set(chordMode.intervals);
    if (intervalsSet.has(7)) {
      intervalsSet.delete(7); // 7th interval is the perfect fifth
      return Array.from(intervalsSet);
    }

    console.warn(
      "Chord %s doesn't have a perfect fifth, developer to adjust",
      chordMode.name
    );
  };

  private processIntervalsInChordMode = (
    intervalsToUse: number[],
    variationsToFill: ChordVariationsByNote,
    sharedArrayCache: SharedArrayCache
  ) => {
    for (
      let stringIndex = MAX_STRING_INDEX_FOR_CHORD_GENERATION; // TODO: We are intentionally limit chords to 6 strings. We don't search for them on the lower string as it requires too much memory to store. We can undo this if there's a better way to store all the chords in a trie for the chord detector // this.neck.length - 1; // starting from the lowest (thickest) string
      stringIndex >= intervalsToUse.length;
      stringIndex--
    ) {
      const neckString = this.neck[stringIndex];
      // loop through the strings starting from the lowest, ensuring there are strings to put all the notes of the chordIntervals
      for (
        let fretIndex = this.capo;
        fretIndex < this.maxFretToProcess; // we intentionally limit chords to 12 frets to improve performance. If performance gets better we can replace that with this.absoluteMaxFretIndex. Skip capo+12th fret and further
        fretIndex++
      ) {
        const currentStringOctaveNote = neckString[fretIndex];
        if (currentStringOctaveNote === null) {
          continue;
        }

        const fretChordsGenerator = new FretChordsGenerator(
          this.capo,
          this.neck,
          this.maxFretToProcess,
          sharedArrayCache
        );

        const newVariationsForNoteAndMode = fretChordsGenerator.processFret(
          intervalsToUse,
          currentStringOctaveNote
        );

        const variationsForNote =
          variationsToFill[currentStringOctaveNote.note] ?? [];

        for (const builder of newVariationsForNoteAndMode) {
          variationsForNote.push(builder);
        }

        variationsToFill[currentStringOctaveNote.note] = variationsForNote;
      }
    }
  };

  private processChordMode = (chordMode: ChordMode) => {
    const variationsByNote: ChordVariationsByNote = [];
    const sharedArrayCache = new SharedArrayCache();
    this.processIntervalsInChordMode(
      chordMode.intervals,
      variationsByNote,
      sharedArrayCache
    );
    const intervalsWithoutPerfectFifth =
      this.buildIntervalsWithoutPerfectFifth(chordMode);
    if (intervalsWithoutPerfectFifth) {
      this.processIntervalsInChordMode(
        intervalsWithoutPerfectFifth,
        variationsByNote,
        sharedArrayCache
      );
    }

    const dataForChordMode: ChordModeVariations = {
      chordMode,
      variationsByNote,
    };

    return dataForChordMode;
  };
}

export const chordsGenerator = new ChordsGenerator();
