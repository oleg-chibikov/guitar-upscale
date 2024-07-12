import { ChordBuilderInfo, FingerAssignment } from "@/app/data/chordModes";
import { MAX_DISTANCE_IN_CHORD } from "@/app/data/chordsGeneratorTypes";
import {
  NOTE_COUNT,
  Neck,
  Note,
  NoteInChord,
  StringOctaveNote,
} from "@/app/data/notes";

type StartingOption = {
  availableFingers: number[];
  fingerAssignment: FingerAssignment;
};

export class FretChordsGenerator {
  private capo: number;
  private absoluteMaxFretIndex: number;
  private neck: Neck;

  constructor(capo: number, neck: Neck, absoluteMaxFretIndex: number) {
    this.capo = capo;
    this.neck = neck;
    this.absoluteMaxFretIndex = absoluteMaxFretIndex;
  }

  private getMatchingNotesOnString(
    stringIndex: number,
    allNotesInChord: Set<Note>,
    previousFinger?: number,
    previousFret?: number
  ): NoteInChord[] {
    const currentString = this.neck[stringIndex];
    const matchingNotes: NoteInChord[] = []; // these are the positions of the chord notes on the current string

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
          this.isValidNoteInChord(previousFinger, previousFret, j))
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
      if (this.isValidNoteInChord(previousFinger, previousFret, fret, finger)) {
        return i;
      }
    }
    return undefined;
  }

  private isValidNoteInChord(
    previousFinger: number | undefined,
    previousFret: number | undefined,
    currentFret: number,
    currentFinger?: number
  ): boolean {
    if (
      previousFinger === undefined ||
      previousFret === undefined ||
      currentFinger === undefined
    ) {
      return true;
    }

    // Ensure higher-indexed fingers are placed on the same fret or to the right
    if (currentFinger > previousFinger && currentFret < previousFret) {
      return false;
    }

    const fingerDistance = Math.abs(currentFinger - previousFinger);
    const maxAllowedDistance = fingerDistance + 1;
    const actualDistance = Math.abs(currentFret - previousFret);

    return actualDistance <= maxAllowedDistance;
  }

  // this method recursively take all the matching notes on the next string (from bottom to top) and build multiple variations of the chord by scanning strings one by 1
  private findChordNotesRecursive = (
    stringIndex: number,
    allNotesInChord: Set<Note>, // all the notes that should participate in chord
    chordBuilder: (StringOctaveNote | undefined)[], // recursively populated array with finger positions
    fingerAssignment: FingerAssignment, // recursively reducing array of available fingers for the current string
    usedNotesSet: Set<Note>, // recursively populated set with used notes
    availableFingers: number[], // fingers still available to use to for the current note
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

    const matchingNotesOnThisString: NoteInChord[] = []; // these are the positions of the chord notes on the current string
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
        const fingerAssignmentCopy = [...fingerAssignment];

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
            fingerAssignment,
            usedNotesSetCopy,
            availableFingers,
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
            fingerAssignment: fingerAssignmentCopy,
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

  processFret = (
    intervalsToUse: number[],
    stringOctaveNote: StringOctaveNote
  ) => {
    const notesInChord: Set<Note> = new Set(
      intervalsToUse.map((x) => (stringOctaveNote.note + x) % NOTE_COUNT)
    );
    const chordBuilder: NoteInChord[] = [...Array(this.neck.length)];
    chordBuilder[stringOctaveNote.string] = stringOctaveNote;
    const usedNotesSet = new Set<Note>();
    usedNotesSet.add(stringOctaveNote.note);

    const stringIndex = stringOctaveNote.string;
    const { startingOptions, newMin, newMax } = this.getStartingOptions(
      stringOctaveNote,
      stringIndex
    );

    return startingOptions.flatMap(({ availableFingers, fingerAssignment }) =>
      this.findChordNotesRecursive(
        stringIndex - 1,
        notesInChord,
        chordBuilder,
        fingerAssignment,
        usedNotesSet,
        availableFingers,
        newMin,
        newMax
      )
    );
  };

  private getStartingOptions(
    stringOctaveNote: StringOctaveNote,
    stringIndex: number
  ) {
    const startingFret = stringOctaveNote.fret;

    const startingOptions: StartingOption[] = [];

    // Initialize fingerAssignment with the correct length
    const baseFingerAssignment: FingerAssignment = new Array(this.neck.length);

    // fret limits for the first
    let newMin: number | undefined;
    let newMax: number | undefined;

    // Handle open string case
    if (startingFret === this.capo) {
      startingOptions.push({
        availableFingers: [1, 2, 3, 4],
        fingerAssignment: [...baseFingerAssignment],
      });
    } else {
      // if we are not on the open string - then we can use only the adjacent several frets in each direction
      ({ newMin, newMax } = this.getFretLimitsForTheFirstTime(startingFret));

      if (stringIndex === this.neck.length - 1) {
        // Lowest string, consider thumb (0) as an option
        const thumbFingerAssignment = [...baseFingerAssignment];
        thumbFingerAssignment[stringIndex] = 0; // Assign thumb to the lowest string. Note that this branch of code excludes open strings (this case it processed separately)
        startingOptions.push({
          availableFingers: [1, 2, 3, 4],
          fingerAssignment: thumbFingerAssignment,
        });
      }

      // Consider each finger as a starting option
      for (let i = 1; i <= 4; i++) {
        const availableFingers = [1, 2, 3, 4].filter((f) => f !== i);
        const currentFingerAssignment = [...baseFingerAssignment];
        currentFingerAssignment[stringIndex] = i;
        startingOptions.push({
          availableFingers,
          fingerAssignment: currentFingerAssignment,
        });
      }
    }
    return { startingOptions, newMin, newMax };
  }
}
