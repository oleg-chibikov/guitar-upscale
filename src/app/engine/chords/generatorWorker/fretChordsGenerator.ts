import { ChordBuilderInfo, FingerAssignment } from "@/app/data/chordModes";
import {
  NOTE_COUNT,
  Neck,
  Note,
  NoteInChord,
  StringOctaveNote,
} from "@/app/data/notes";

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
    chordBuilder: NoteInChord[], // recursively populated array with finger positions
    fingerAssignment: FingerAssignment, // recursively reducing array of available fingers for the current string
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
        const fingerAssignmentCopy = [...fingerAssignment];
        chordBuilderCopy[stringIndex] = stringOctaveNote;
        const usedNotesSetCopy = new Set(usedNotesSet);
        const newAvailableFingers = [...availableFingers];
        let newPreviousFinger: number | undefined = previousFinger;
        let newPreviousFret: number | undefined = previousFret;

        if (stringOctaveNote === undefined) {
          fingerAssignmentCopy[stringIndex] = undefined;
        } else if (stringOctaveNote.fret === this.capo) {
          usedNotesSetCopy.add(stringOctaveNote.note);
          fingerAssignmentCopy[stringIndex] = undefined;
          // Don't update newPreviousFinger and newPreviousFret for open strings
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
          fingerAssignmentCopy[stringIndex] = newPreviousFinger;

          if (previousFret !== fret) {
            newAvailableFingers.splice(fingerIndex, 1);
          }
        }

        if (stringIndex > 0) {
          return this.findChordNotesRecursive(
            stringIndex - 1,
            allNotesInChord,
            chordBuilderCopy,
            fingerAssignmentCopy,
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
            fingerAssignment: fingerAssignmentCopy,
          },
        ];
      })
      .filter((x) => x) as ChordBuilderInfo[];
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
    const startingFret =
      stringOctaveNote.fret === this.capo ? undefined : stringOctaveNote.fret;

    const startingOptions: {
      finger: number | undefined;
      availableFingers: number[];
      fingerAssignment: FingerAssignment;
    }[] = [];

    // Initialize fingerAssignment with the correct length
    const baseFingerAssignment: FingerAssignment = new Array(this.neck.length);

    if (stringIndex === this.neck.length - 1) {
      // Lowest string, consider thumb (0) as an option
      const thumbFingerAssignment = [...baseFingerAssignment];
      thumbFingerAssignment[stringIndex] = 0; // Assign thumb to the lowest string
      startingOptions.push({
        finger: 0,
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
        finger: i,
        availableFingers,
        fingerAssignment: currentFingerAssignment,
      });
    }

    return startingOptions.flatMap(
      ({ finger, availableFingers, fingerAssignment }) =>
        this.findChordNotesRecursive(
          stringIndex - 1,
          notesInChord,
          chordBuilder,
          fingerAssignment,
          usedNotesSet,
          availableFingers,
          finger,
          startingFret
        )
    );
  };
}
