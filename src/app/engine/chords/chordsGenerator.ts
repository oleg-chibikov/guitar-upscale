import {
  ChordMode,
  ChordModeVariationsContainer,
  ChordVariationsByNote,
} from "@/app/data/chordModes";
import {
  GenerateChordsCallbackMessage,
  GenerateChordsRequest,
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

type FingerAssignment = (number | undefined)[];

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

  private getMatchingNotesOnString(
    stringIndex: number,
    allNotesInChord: Set<Note>,
    previousFinger?: number,
    previousFret?: number
  ): FingerPosition[] {
    const currentString = this.neck[stringIndex];
    const matchingNotes: FingerPosition[] = []; // these are the positions of the chord notes on the current string

    const openStringNote = currentString[this.capo];
    if (openStringNote !== null && allNotesInChord.has(openStringNote.note)) {
      matchingNotes.push(openStringNote);
    }

    for (let j = this.capo + 1; j <= this.absoluteMaxFretIndex; j++) {
      const nonOpenStringNote = currentString[j];
      if (
        nonOpenStringNote !== null &&
        allNotesInChord.has(nonOpenStringNote.note) &&
        (previousFret === undefined ||
          this.isValidFingerPosition(previousFinger, previousFret, j))
      ) {
        matchingNotes.push(nonOpenStringNote);
      }
    }

    matchingNotes.push(undefined); // try muting this string (no note on the string)
    return matchingNotes;
  }

  private assignFinger(
    fret: number,
    availableFingers: number[],
    previousFinger?: number,
    previousFret?: number
  ): number | undefined {
    for (let i = 0; i < availableFingers.length; i++) {
      const finger = availableFingers[i];
      if (
        this.isValidFingerPosition(previousFinger, previousFret, fret, finger)
      ) {
        return i;
      }
    }
    return undefined;
  }

  private isValidFingerPosition(
    previousFinger: number | undefined,
    previousFret: number | undefined,
    currentFret: number,
    currentFinger?: number
  ): boolean {
    if (previousFinger === undefined || previousFret === undefined) {
      return true;
    }

    const fingerDistance =
      currentFinger !== undefined
        ? Math.abs(currentFinger - previousFinger)
        : 0;
    const maxAllowedDistance = fingerDistance + 1;
    const actualDistance = Math.abs(currentFret - previousFret);

    return actualDistance <= maxAllowedDistance;
  }

  // this method recursively take all the matching notes on the next string (from bottom to top) and build multiple variations of the chord by scanning strings one by 1 and considering finger positions
  private findChordNotesRecursive = (
    stringIndex: number,
    allNotesInChord: Set<Note>, // all the notes that should participate in chord
    chordBuilder: FingerPosition[], // recursively populated array with finger positions
    fingerAssignments: FingerAssignment, // recursively reducing array of available fingers for the current string
    usedNotesSet: Set<Note>, // recursively populated set with used notes
    availableFingers: number[],
    previousFinger: number | undefined = undefined,
    previousFret: number | undefined = undefined
  ): ChordBuilderInfo[] => {
    const matchingNotesOnThisString = this.getMatchingNotesOnString(
      stringIndex,
      allNotesInChord,
      previousFinger,
      previousFret
    );

    return matchingNotesOnThisString
      .flatMap((stringOctaveNote) => {
        const chordBuilderCopy = [...chordBuilder];
        const fingerAssignmentsCopy = [...fingerAssignments];
        chordBuilderCopy[stringIndex] = stringOctaveNote;
        const usedNotesSetCopy = new Set(usedNotesSet);
        const newAvailableFingers = [...availableFingers];
        let newPreviousFinger: number | undefined = previousFinger;
        let newPreviousFret: number | undefined = previousFret;

        if (stringOctaveNote === undefined) {
          fingerAssignmentsCopy[stringIndex] = undefined;
        } else if (stringOctaveNote.fret === this.capo) {
          usedNotesSetCopy.add(stringOctaveNote.note);
          fingerAssignmentsCopy[stringIndex] = undefined;
        } else {
          usedNotesSetCopy.add(stringOctaveNote.note);
          const fret = stringOctaveNote.fret;

          const fingerIndex = this.assignFinger(
            fret,
            availableFingers,
            previousFinger,
            previousFret
          );

          if (fingerIndex === undefined) {
            return undefined;
          }

          newPreviousFinger = newAvailableFingers[fingerIndex];
          newPreviousFret = fret;
          fingerAssignmentsCopy[stringIndex] = newPreviousFinger;

          if (previousFret !== fret) {
            newAvailableFingers.splice(fingerIndex, 1);
          }
        }

        if (stringIndex > 0) {
          return this.findChordNotesRecursive(
            stringIndex - 1,
            allNotesInChord,
            chordBuilderCopy,
            fingerAssignmentsCopy,
            usedNotesSetCopy,
            newAvailableFingers,
            newPreviousFinger,
            newPreviousFret
          );
        }

        const requiredNotesArray = Array.from(allNotesInChord);
        for (const requiredNote of requiredNotesArray) {
          if (!usedNotesSetCopy.has(requiredNote)) {
            return undefined;
          }
        }
        return [
          {
            variation: chordBuilderCopy,
            fingerPositions: fingerAssignmentsCopy,
            usedFingers: availableFingers.length - newAvailableFingers.length,
          },
        ];
      })
      .filter((x) => x) as ChordBuilderInfo[];
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
    // console.log("Processing", currentStringOctaveNote);
    const chordBuilder: FingerPosition[] = [...Array(this.neck.length)];
    chordBuilder[stringOctaveNote.string] = stringOctaveNote;
    const usedNotesSet = new Set<Note>();
    usedNotesSet.add(stringOctaveNote.note);

    const stringIndex = stringOctaveNote.string;
    // otherwise we are on the open string then we can use any fret for the next note
    // for each note and chord mode we build the realistic finger positions

    const initialAvailableFingers = [1, 2, 3, 4]; // Index, middle, ring, pinky
    return this.findChordNotesRecursive(
      stringIndex - 1,
      notesInChord,
      chordBuilder,
      [], // Initialize finger assignments
      usedNotesSet,
      initialAvailableFingers
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
