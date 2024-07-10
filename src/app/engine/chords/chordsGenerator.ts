import {
  ChordMode,
  ChordModeVariationsContainer,
  ChordVariationsByNote,
} from "@/app/data/chordModes";
import {
  GenerateChordsCallbackMessage,
  GenerateChordsRequest,
  MAX_DISTANCE_IN_CHORD,
  MAX_STRING_INDEX_FOR_CHORD_GENERATION,
} from "@/app/data/chordsGeneratorTypes";
import {
  FingerPosition,
  NOTE_COUNT,
  Note,
  StringOctaveNote,
} from "@/app/data/notes";
import {
  ChordPreferredVariations,
  getPreferredChordVariations,
} from "@/app/engine/chords/chordVariationHelper";
import { Neck } from "@/app/engine/generateNeckRepresentation";

type ChordBuilderInfo = {
  variation: FingerPosition[];
  minAllowedFretIndex?: number;
  maxAllowedFretIndex?: number;
};

class ChordsGenerator {
  private capo = 0;
  private absoluteMaxFretIndex = 0;
  private neck: Neck = [];

  constructor() {
    console.log("Creating ChordGenerator");
  }

  processInWorker({ neck, capo, chordModes }: GenerateChordsRequest): void {
    this.capo = capo;
    this.neck = neck;
    this.absoluteMaxFretIndex = neck[0].length - 1;

    const chordModesCount = chordModes.length;

    for (let index = 0; index < chordModesCount; index++) {
      const chordMode = chordModes[index];

      if (chordMode.intervals.length > this.neck.length) {
        // cannot build this chord on the given guitar - it has more notes that the strings guitar has
        continue;
      }

      const chordModeVariationsContainer = this.processChordMode(chordMode);

      // Post a message for each processed chord mode
      self.postMessage({
        type: "chordModeProcessed",
        chordModeVariationsContainer,
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

  // this method recursively take all the matching notes on the next string (from bottom to top) and build multiple variations of the chord by scanning strings one by 1
  private findChordNotesRecursive = (
    stringIndex: number,
    allNotesInChord: Set<Note>, // all the notes that should participate in chord
    chordBuilder: (StringOctaveNote | undefined)[], // recursively populated array with finger positions
    usedNotesSet: Set<Note>, // recursively populated set with used notes
    minAllowedFretIndex?: number,
    maxAllowedFretIndex?: number
  ): ChordBuilderInfo[] => {
    // if (
    //   allNotesInChord.has(Note.G) &&
    //   allNotesInChord.has(Note.B) &&
    //   allNotesInChord.has(Note.D) &&
    //   chordBuilder[5]?.fret === 3 &&
    //   chordBuilder[4]?.fret === 2 &&
    //   chordBuilder[3]?.fret === 0 &&
    //   chordBuilder[2]?.fret === 0 &&
    //   chordBuilder[1]?.fret === 0
    // ) {
    //   debugger;
    // }
    const currentString = this.neck[stringIndex];

    const matchingNotesOnThisString: FingerPosition[] = []; // these are the positions of the chord notes on the current string
    // Always take the open note into account
    const openStringNote = currentString[this.capo];
    if (openStringNote !== null && allNotesInChord.has(openStringNote.note)) {
      matchingNotesOnThisString.push(openStringNote);
    }

    for (
      let j = minAllowedFretIndex ?? this.capo + 1;
      j <= (maxAllowedFretIndex ?? this.absoluteMaxFretIndex);
      j++
    ) {
      const nonOpenStringNote = this.neck[stringIndex][j];
      if (
        nonOpenStringNote !== null &&
        allNotesInChord.has(nonOpenStringNote.note)
      ) {
        matchingNotesOnThisString.push(nonOpenStringNote);
      }
    }

    matchingNotesOnThisString.push(undefined); // try muting this string (no note on the string)

    return matchingNotesOnThisString
      .flatMap((stringOctaveNote) => {
        const chordBuilderCopy = [...chordBuilder];
        chordBuilderCopy[stringIndex] = stringOctaveNote;
        const usedNotesSetCopy = new Set(usedNotesSet);
        // limits for the next string
        let newMin: number | undefined;
        let newMax: number | undefined;

        if (stringOctaveNote === undefined) {
          // this is a muted string
          // leave limits intact
          newMin = minAllowedFretIndex;
          newMax = maxAllowedFretIndex;
        } else {
          usedNotesSetCopy.add(stringOctaveNote.note);
          // calculate possible range for the next string
          const fret = stringOctaveNote.fret;

          if (
            minAllowedFretIndex === undefined ||
            maxAllowedFretIndex === undefined
          ) {
            // limits are not set yet (open notes were used on all the previous strings)

            if (fret > this.capo) {
              // we use a fret on non open string and need to adjust the limits for the next string
              ({ newMin, newMax } = this.getFretLimitsForTheFirstTime(fret));
            }
            // else they are left undefined
          } else if (fret === this.capo) {
            // leave limits intact
            newMin = minAllowedFretIndex;
            newMax = maxAllowedFretIndex;
          } else {
            // adjust according to the current note

            // we can allow max MAX_DISTANCE_IN_CHORD frets in any direction. If we go left from the note on the next string - then the max limit should be recalculated from the leftmost position and vice versa for the right direction
            newMax = Math.min(
              fret + MAX_DISTANCE_IN_CHORD,
              maxAllowedFretIndex
            );
            newMin = Math.max(
              fret - MAX_DISTANCE_IN_CHORD,
              minAllowedFretIndex
            );
          }
        }

        if (stringIndex > 0) {
          return this.findChordNotesRecursive(
            stringIndex - 1,
            allNotesInChord,
            chordBuilderCopy,
            usedNotesSetCopy,
            newMin,
            newMax
          );
        }
        // this branch returns the final result
        const requiredNotesArray = Array.from(allNotesInChord);
        for (const requiredNote of requiredNotesArray) {
          if (!usedNotesSetCopy.has(requiredNote)) {
            return null;
          }
        }
        return [
          {
            variation: chordBuilderCopy,
            minAllowedFretIndex: newMin,
            maxAllowedFretIndex: newMax,
          },
        ];
      })
      .filter((x) => x) as ChordBuilderInfo[]; // exclude incomplete chords;
  };

  private getFretLimitsForTheFirstTime = (fretIndex: number) => {
    const newMin = Math.max(this.capo + 1, fretIndex - MAX_DISTANCE_IN_CHORD);

    const newMax = Math.min(
      this.absoluteMaxFretIndex,
      fretIndex + MAX_DISTANCE_IN_CHORD
    );
    return { newMin, newMax };
  };

  private processIntervalsInChordMode = (
    intervalsToUse: number[],
    variationsToFill: ChordVariationsByNote
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
        fretIndex < this.absoluteMaxFretIndex;
        fretIndex++
      ) {
        const currentStringOctaveNote = neckString[fretIndex];
        if (currentStringOctaveNote === null) {
          continue;
        }

        const newVariationsForNoteAndMode = this.processFret(
          intervalsToUse,
          currentStringOctaveNote
        );

        const variationsForNote =
          variationsToFill[currentStringOctaveNote.note] ?? [];

        for (const builder of newVariationsForNoteAndMode) {
          variationsForNote.push(builder.variation);
        }

        variationsToFill[currentStringOctaveNote.note] = variationsForNote;
      }
    }
  };

  private processChordMode = (chordMode: ChordMode) => {
    const variationsByNote: ChordVariationsByNote = [];
    this.processIntervalsInChordMode(chordMode.intervals, variationsByNote);
    const intervalsWithoutPerfectFifth =
      this.buildIntervalsWithoutPerfectFifth(chordMode);
    if (intervalsWithoutPerfectFifth) {
      this.processIntervalsInChordMode(
        intervalsWithoutPerfectFifth,
        variationsByNote
      );
    }

    const preferredVariationsByNote = this.fillPreferredVariations(
      variationsByNote,
      chordMode
    );

    const dataForChordMode: ChordModeVariationsContainer = {
      chordModeVariations: { chordMode, variationsByNote },
      preferredVariationsByNote,
    };
    return dataForChordMode;
  };

  private processFret = (
    intervalsToUse: number[],
    stringOctaveNote: StringOctaveNote
  ) => {
    const notesInChord: Set<Note> = new Set(
      intervalsToUse.map((x) => (stringOctaveNote.note + x) % NOTE_COUNT)
    );
    const fretIndex = stringOctaveNote.fret;
    // console.log("Processing", currentStringOctaveNote);
    const chordBuilder: FingerPosition[] = [...Array(this.neck.length)];
    chordBuilder[stringOctaveNote.string] = stringOctaveNote;
    const usedNotesSet = new Set<Note>();
    usedNotesSet.add(stringOctaveNote.note);

    // fret limits for the first
    let newMin: number | undefined;
    let newMax: number | undefined;

    if (fretIndex !== this.capo) {
      // if we are not on the open string - then we can use only the adjacent several frets in each direction
      ({ newMin, newMax } = this.getFretLimitsForTheFirstTime(fretIndex));
    }

    const stringIndex = stringOctaveNote.string;
    // otherwise we are on the open string then we can use any fret for the next note
    // for each note and chord mode we build the realistic finger positions
    return this.findChordNotesRecursive(
      stringIndex - 1,
      notesInChord,
      chordBuilder,
      usedNotesSet,
      newMin,
      newMax
    );
  };

  private fillPreferredVariations(
    variationsByNote: ChordVariationsByNote,
    chordMode: ChordMode
  ) {
    const preferredVariationsByNote: (ChordPreferredVariations | undefined)[] =
      [];
    for (let note = 0; note < NOTE_COUNT; note++) {
      const noteChords = variationsByNote[note];
      if (noteChords === undefined || noteChords.length === 0) {
        continue;
      }

      // after the mode has been processed we need to find the preferred variation for it and put into the dedicated map
      preferredVariationsByNote[note] = getPreferredChordVariations(
        noteChords,
        chordMode.name === "5" ? "low" : "high", // Power chords prefer lower strings
        this.neck.length
      );
    }

    return preferredVariationsByNote;
  }
}

export const chordsGenerator = new ChordsGenerator();
