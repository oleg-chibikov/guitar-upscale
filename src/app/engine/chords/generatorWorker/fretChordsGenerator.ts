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
  availableFretByFingerIndex: number[];
  fingerAssignment: FingerAssignment;
};

const THUMB = 4;

type RecursiveContainers = {
  availableFretByFingerIndex: (number | undefined)[]; // array of 4 numbers for each finger except the thumb. undefined means this finger can be used for any fret. Otherwise we limit it only to a single fret onwards (barre). It can be set to -1 meaning this finger cannot be used anymore
  chordBuilder: NoteInChord[]; // notes that will be used in chord
  fingerAssignment: FingerAssignment; // how fingers are assigned to the strings
  usedNotesSet: Set<Note>; // contains all distinct notes currently used in the chord that's being built
  barreFretByFingerIndex: (number | undefined)[]; // array of 4 numbers for each finger except the thumb. Having a value here means that this finger does a barre on a certain fret (uses 2+ strings)
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

  private initArrayOfFingers = () => Array(4).fill(undefined);

  // this method recursively take all the matching notes on the next string (from bottom to top) and build multiple variations of the chord by scanning strings one by 1
  private findChordNotesRecursive = (
    stringIndex: number,
    allNotesInChord: Set<Note>, // all the notes that should participate in chord
    recursiveData: RecursiveContainers,
    minAllowedFretIndex: number | undefined,
    maxAllowedFretIndex: number | undefined
  ): ChordBuilderInfo[] => {
    // for every new recursive branch we need to have copies of all the recursively filled containers
    const copyRecursiveContainersForTheNextBranch = (): RecursiveContainers => {
      const availableFretByFingerIndex = [
        ...recursiveData.availableFretByFingerIndex,
      ];
      const chordBuilder = [...recursiveData.chordBuilder];
      const usedNotesSet = new Set(recursiveData.usedNotesSet);
      const fingerAssignment = [...recursiveData.fingerAssignment];
      const barreFretByFingerIndex = [...recursiveData.barreFretByFingerIndex];
      return {
        availableFretByFingerIndex,
        chordBuilder,
        fingerAssignment,
        usedNotesSet,
        barreFretByFingerIndex,
      };
    };

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

    const matchingNotesOnThisString = this.getMatchingNotesOnCurrentString(
      stringIndex,
      allNotesInChord,
      minAllowedFretIndex,
      maxAllowedFretIndex
    );

    // const fingerOnPreviousString = fingerAssignment[stringIndex + 1];
    // let fretUsedOnPreviousString = chordBuilder[stringIndex + 1]?.fret;
    // if (fretUsedOnPreviousString === this.capo) {
    //   fretUsedOnPreviousString = undefined;
    // }

    return matchingNotesOnThisString
      .flatMap((stringOctaveNote) => {
        if (stringOctaveNote === undefined) {
          // this is a muted string

          // we cannot continue any existing barre anymore when muting a string. if it exists we cannot continue as the barre has to occupy all the strings up to the highest
          if (
            this.checkIfThereIsBarreOnHigherFret(
              -1, // check all fingers
              this.capo,
              recursiveData.barreFretByFingerIndex
            )
          ) {
            return null;
          }

          const recursiveDataCopies = copyRecursiveContainersForTheNextBranch();

          // TODO: note sure if this makes for a muted string sense but safer to keep
          this.preventCurrentBarresToContinueOnHigherStrings(
            recursiveDataCopies.availableFretByFingerIndex
          );

          return this.processNoteRecursively(
            stringIndex,
            allNotesInChord,
            recursiveDataCopies,
            minAllowedFretIndex, // leave limits and previously used finger/fret intact
            maxAllowedFretIndex
          );
        }

        // calculate possible range for the next string
        const fret = stringOctaveNote.fret;
        const isOpenString = fret === this.capo;

        if (isOpenString) {
          // we cannot continue any existing barre anymore when using an open string. if it exists we cannot continue as the barre has to occupy all the strings up to the highest
          if (
            this.checkIfThereIsBarreOnHigherFret(
              -1, // check all fingers
              fret,
              recursiveData.barreFretByFingerIndex
            )
          ) {
            return null;
          }

          const recursiveDataCopies = copyRecursiveContainersForTheNextBranch();

          recursiveDataCopies.usedNotesSet.add(stringOctaveNote.note);
          recursiveDataCopies.chordBuilder[stringIndex] = stringOctaveNote;

          // TODO: note sure if this makes for an open string sense but safer to keep
          this.preventCurrentBarresToContinueOnHigherStrings(
            recursiveDataCopies.availableFretByFingerIndex
          );

          return this.processNoteRecursively(
            stringIndex,
            allNotesInChord,
            recursiveDataCopies,
            minAllowedFretIndex, // leave limits intact
            maxAllowedFretIndex
          );
        }

        // Below is non-capo fret processing
        // we should try putting all available fingers on each note
        return recursiveData.availableFretByFingerIndex.flatMap(
          (theOnlyAllowedFret, currentFingerIndex) => {
            if (
              theOnlyAllowedFret !== undefined &&
              stringOctaveNote.fret !== theOnlyAllowedFret
            ) {
              // if we have already used this finger - it means we can only use it on the same fret on a higher string (barre). In any other case we cannot apply this finger anymore
              return null;
            }

            if (
              !this.checkIfFingerPositionIsValid(
                stringIndex,
                fret,
                currentFingerIndex,
                recursiveData
              )
            ) {
              return null;
            }

            if (
              this.checkIfThereIsBarreOnHigherFret(
                currentFingerIndex,
                fret,
                recursiveData.barreFretByFingerIndex
              )
            ) {
              return null;
            }

            // calculate fret limits for the next string
            const {
              newMin,
              newMax,
            }: { newMin: number | undefined; newMax: number | undefined } =
              this.updateMinAndMaxFretPositions(
                minAllowedFretIndex,
                maxAllowedFretIndex,
                fret
              );

            const recursiveDataCopies =
              copyRecursiveContainersForTheNextBranch();

            recursiveDataCopies.usedNotesSet.add(stringOctaveNote.note);

            recursiveDataCopies.fingerAssignment[stringIndex] =
              currentFingerIndex;

            recursiveDataCopies.chordBuilder[stringIndex] = stringOctaveNote;

            // this finger can only be used for barre on higher strings
            if (
              recursiveDataCopies.availableFretByFingerIndex[
                currentFingerIndex
              ] === undefined
            ) {
              recursiveDataCopies.availableFretByFingerIndex[
                currentFingerIndex
              ] = fret;
            }

            if (
              theOnlyAllowedFret !== undefined &&
              fret === theOnlyAllowedFret
            ) {
              recursiveDataCopies.barreFretByFingerIndex[currentFingerIndex] =
                fret;
            }

            this.preventCurrentBarresToContinueOnHigherStrings(
              recursiveDataCopies.availableFretByFingerIndex,
              fret
            );

            return this.processNoteRecursively(
              stringIndex,
              allNotesInChord,
              recursiveDataCopies,
              newMin,
              newMax
            );
          }
        );
      })
      .filter((x) => x) as ChordBuilderInfo[]; // exclude incomplete chords;
  };

  private updateMinAndMaxFretPositions(
    minAllowedFretIndex: number | undefined,
    maxAllowedFretIndex: number | undefined,
    fret: number
  ) {
    let newMin: number | undefined;
    let newMax: number | undefined;
    // adjust limits according to the current note
    if (
      minAllowedFretIndex === undefined ||
      maxAllowedFretIndex === undefined
    ) {
      // limits are not set yet (open notes were used on all the previous strings)
      // we use a fret on non open string and need to adjust the limits for the next string
      ({ newMin, newMax } = this.getFretLimitsForTheFirstTime(fret));
    } else {
      // else they are left undefined
      // we can allow max MAX_DISTANCE_IN_CHORD frets in any direction. If we go left from the note on the next string - then the max limit should be recalculated from the leftmost position and vice versa for the right direction
      newMax = Math.min(fret + MAX_DISTANCE_IN_CHORD, maxAllowedFretIndex);
      newMin = Math.max(fret - MAX_DISTANCE_IN_CHORD, minAllowedFretIndex);
    }
    return { newMin, newMax };
  }

  private checkIfFingerPositionIsValid(
    stringIndex: number,
    fret: number,
    currentFingerIndex: number,
    recursiveData: RecursiveContainers
  ) {
    // going through each of the previous strings
    for (let i = stringIndex; i < this.neck.length; i++) {
      // if we used a finger 1 on a lower string at a fret 5 it means that we can use fingers 2 and 3 on a frets >= 5 and we can use finger 0 on fret <= 5
      const fingerUsedOnThisString = recursiveData.fingerAssignment[i];
      let fretUsedOnThisString = recursiveData.chordBuilder[i]?.fret;
      if (fretUsedOnThisString === this.capo) {
        fretUsedOnThisString = undefined;
      }

      if (
        fingerUsedOnThisString !== undefined &&
        fretUsedOnThisString !== undefined
      ) {
        if (
          fret > fretUsedOnThisString &&
          currentFingerIndex <= fingerUsedOnThisString
        ) {
          return false;
        }

        if (
          fret < fretUsedOnThisString &&
          currentFingerIndex >= fingerUsedOnThisString
        ) {
          return false;
        }
      }
    }

    return true;
  }

  // recursive call for a single note
  private processNoteRecursively = (
    stringIndex: number,
    allNotesInChord: Set<Note>,
    recursiveData: RecursiveContainers,
    minAllowedFretIndex: number | undefined,
    maxAllowedFretIndex: number | undefined
  ) => {
    if (stringIndex > 0) {
      return this.findChordNotesRecursive(
        stringIndex - 1,
        allNotesInChord,
        recursiveData,
        minAllowedFretIndex,
        maxAllowedFretIndex
      );
    }
    // this branch returns the final result
    const requiredNotesArray = Array.from(allNotesInChord);
    for (const requiredNote of requiredNotesArray) {
      if (!recursiveData.usedNotesSet.has(requiredNote)) {
        return null;
      }
    }
    return [
      {
        variation: recursiveData.chordBuilder,
        fingerAssignment: recursiveData.fingerAssignment,
      } as ChordBuilderInfo,
    ];
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

    return startingOptions.flatMap(
      ({ availableFretByFingerIndex, fingerAssignment }) =>
        this.findChordNotesRecursive(
          stringIndex - 1,
          notesInChord,
          {
            chordBuilder,
            fingerAssignment,
            usedNotesSet,
            availableFretByFingerIndex,
            barreFretByFingerIndex: this.initArrayOfFingers(),
          },
          newMin,
          newMax
        )
    );
  };

  private preventCurrentBarresToContinueOnHigherStrings(
    availableFretByFingerIndex: (number | undefined)[],
    afterFret?: number
  ) {
    // if a string is muted it means that we cannot reuse the barre fingers anymore. We are setting all these fingers to -1 meaning they won't be reused.
    // for the fingers that are still not used we can continue using them (including as barre)
    for (let i = 0; i < 4; i++) {
      const fretUsedWithFinger = availableFretByFingerIndex[i];
      if (fretUsedWithFinger !== undefined) {
        if (afterFret === undefined || fretUsedWithFinger > afterFret)
          availableFretByFingerIndex[i] = -1;
      }
    }
  }

  private checkIfThereIsBarreOnHigherFret(
    currentFingerIndex: number,
    fret: number,
    barreFretByFingerIndex: (number | undefined)[]
  ) {
    for (let i = currentFingerIndex + 1; i < 4; i++) {
      const barreFretOnOtherFinger = barreFretByFingerIndex[i];
      if (
        barreFretOnOtherFinger !== undefined &&
        barreFretOnOtherFinger > fret
      ) {
        // we cannot use a fret if the other finger does a barre on a higher fret (the barre could start on any string , but should go up to the very first string - that's how a guitarist can only use his hand)
        return true;
      }
    }
    return false;
  }

  private getMatchingNotesOnCurrentString(
    stringIndex: number,
    allNotesInChord: Set<Note>,
    minAllowedFretIndex: number | undefined,
    maxAllowedFretIndex: number | undefined
  ): NoteInChord[] {
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
    return matchingNotesOnThisString;
  }

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
        availableFretByFingerIndex: this.initArrayOfFingers(),
        fingerAssignment: [...baseFingerAssignment],
      });
    } else {
      // if we are not on the open string - then we can use only the adjacent several frets in each direction
      ({ newMin, newMax } = this.getFretLimitsForTheFirstTime(startingFret));

      if (stringIndex === this.neck.length - 1) {
        // Lowest string, consider thumb as an option
        const thumbFingerAssignment = [...baseFingerAssignment];
        thumbFingerAssignment[stringIndex] = THUMB; // Assign thumb to the lowest string. Note that this branch of code excludes open strings (this case it processed separately)
        startingOptions.push({
          availableFretByFingerIndex: this.initArrayOfFingers(),
          fingerAssignment: thumbFingerAssignment,
        });
      }

      // Consider each finger as a starting option
      for (let i = 0; i < 4; i++) {
        const availableFretByFingerIndex = this.initArrayOfFingers();
        availableFretByFingerIndex[i] = startingFret; // it means that we can use this finger only for this fret on the higher strings (barre)
        const currentFingerAssignment = [...baseFingerAssignment];
        currentFingerAssignment[stringIndex] = i;
        startingOptions.push({
          availableFretByFingerIndex,
          fingerAssignment: currentFingerAssignment,
        });
      }
    }
    return { startingOptions, newMin, newMax };
  }
}
