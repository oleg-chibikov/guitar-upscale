import { ChordBuilderInfo, FingerAssignment } from "@/app/data/chordModes";
import {
  NOTE_COUNT,
  Neck,
  Note,
  NoteInChord,
  StringOctaveNote,
} from "@/app/data/notes";
import {
  getPossibleFullFingerStretch,
  isWithinAllowedDistance,
} from "@/app/engine/chords/generatorWorker/fretDistanceChecker";

const THUMB = 4;
const NON_THUMB_FINGER_COUNT = 4;

// TODO: Possible finger alignment when using thumb

type OptionalNumber = number | undefined;
type OptionalNumberArray = OptionalNumber[];
type StartingOption = {
  availableFretByFingerIndex: OptionalNumberArray;
  fingerAssignment: FingerAssignment;
  maxFingerUsedByFret: OptionalNumberArray;
};
type RecursiveContainers = {
  availableFretByFingerIndex: OptionalNumberArray; // array of 4 numbers for each finger except the thumb. undefined means this finger can be used for any fret. Otherwise we limit it only to a single fret onwards (barre). It can be set to -1 meaning this finger cannot be used anymore
  usedFretByFingerIndex: OptionalNumberArray; // the same as previous, but cannot be set to -1
  chordBuilder: NoteInChord[]; // notes that will be used in chord
  fingerAssignment: FingerAssignment; // how fingers are assigned to the strings
  usedNotesSet: Set<Note>; // contains all distinct notes currently used in the chord that's being built
  barreFretByFingerIndex: OptionalNumberArray; // array of 4 numbers for each finger except the thumb. Having a value here means that this finger does a barre on a certain fret (uses 2+ strings)
  maxFingerUsedByFret: OptionalNumberArray; // this prevents a lower finger to be placed on higher string for the same fret. Although technically possible (but hard to put fingers in such manner) such finger arrangement rarely makes practical sense
};

export class FretChordsGenerator {
  private capo: number;
  private maxFretToProcess: number;
  private neck: Neck;

  constructor(capo: number, neck: Neck, maxFretToProcess: number) {
    this.capo = capo;
    this.neck = neck;
    this.maxFretToProcess = maxFretToProcess;
  }

  private initArrayOfFingers = () => Array(4).fill(undefined);

  // this method recursively take all the matching notes on the next string (from bottom to top) and build multiple variations of the chord by scanning strings one by 1
  private findChordNotesRecursive = (
    stringIndex: number,
    allNotesInChord: Set<Note>, // all the notes that should participate in chord
    recursiveData: RecursiveContainers,
    minAllowedFretIndex: OptionalNumber,
    maxAllowedFretIndex: OptionalNumber
  ): ChordBuilderInfo[] => {
    // for every new recursive branch we need to have copies of all the recursively filled containers
    const copyRecursiveContainersForTheNextBranch = (): RecursiveContainers => {
      const availableFretByFingerIndex = [
        ...recursiveData.availableFretByFingerIndex,
      ];
      const usedFretByFingerIndex = [...recursiveData.usedFretByFingerIndex];
      const chordBuilder = [...recursiveData.chordBuilder];
      const usedNotesSet = new Set(recursiveData.usedNotesSet);
      const fingerAssignment = [...recursiveData.fingerAssignment];
      const barreFretByFingerIndex = [...recursiveData.barreFretByFingerIndex];
      const maxFingerUsedByFret = [...recursiveData.maxFingerUsedByFret];
      return {
        usedFretByFingerIndex,
        availableFretByFingerIndex,
        chordBuilder,
        fingerAssignment,
        usedNotesSet,
        barreFretByFingerIndex,
        maxFingerUsedByFret,
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

            // check which fret is used on the closest previous finger
            if (
              checkHasFurtherFingerOnLowerFrets(
                recursiveData,
                fret,
                currentFingerIndex
              )
            ) {
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

            if (
              isInvalidDistanceBetweenCurrentAndPreviousFingers(
                currentFingerIndex,
                recursiveData,
                fret
              )
            ) {
              return null;
            }

            if (
              isInvalidDistanceBetweenCurrentAndNextFingers(
                currentFingerIndex,
                recursiveData,
                fret
              )
            ) {
              return null;
            }

            // calculate fret limits for the next string
            const {
              newMin,
              newMax,
            }: { newMin: OptionalNumber; newMax: OptionalNumber } =
              this.updateMinAndMaxFretPositions(
                minAllowedFretIndex,
                maxAllowedFretIndex,
                fret
              );

            const isBarreOnCurrentFret =
              theOnlyAllowedFret !== undefined && fret === theOnlyAllowedFret;

            if (isBarreOnCurrentFret) {
              // having a barre and another finger on the same fret is highly unlikely - skipping this chord
              const hasSameFretUsedByDifferentFinger =
                checkHasSameFretUsedByDifferentFinger(
                  currentFingerIndex,
                  recursiveData,
                  fret
                );
              if (hasSameFretUsedByDifferentFinger) {
                return null;
              }
            }

            const recursiveDataCopies =
              copyRecursiveContainersForTheNextBranch();

            recursiveData.maxFingerUsedByFret[fret] = currentFingerIndex;
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
              recursiveDataCopies.usedFretByFingerIndex[currentFingerIndex] =
                fret;
            }

            if (isBarreOnCurrentFret) {
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
    minAllowedFretIndex: OptionalNumber,
    maxAllowedFretIndex: OptionalNumber,
    fret: number
  ) {
    let newMin: OptionalNumber;
    let newMax: OptionalNumber;
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
      // we can allow max MAX_DISTANCE_IN_CHORD frets in any direction (it depends on the current fret). If we go left from the note on the next string - then the max limit should be recalculated from the leftmost position and vice versa for the right direction

      newMin = Math.max(
        fret - getPossibleFullFingerStretch(minAllowedFretIndex),
        minAllowedFretIndex
      );

      newMax = Math.min(
        fret + getPossibleFullFingerStretch(fret),
        maxAllowedFretIndex
      );
    }
    return { newMin, newMax };
  }

  private checkIfFingerPositionIsValid(
    currentStringIndex: number,
    fret: number,
    currentFingerIndex: number,
    recursiveData: RecursiveContainers
  ) {
    // going through each of the previous strings
    for (
      let lowerStringIndex = currentStringIndex + 1;
      lowerStringIndex < this.neck.length;
      lowerStringIndex++
    ) {
      // if we used a finger 1 on a lower string at a fret 5 it means that we can use fingers 2 and 3 on a frets >= 5 and we can use finger 0 on fret <= 5
      const fingerUsedOnLowerString =
        recursiveData.fingerAssignment[lowerStringIndex];
      let fretUsedOnLowerString =
        recursiveData.chordBuilder[lowerStringIndex]?.fret;
      if (fretUsedOnLowerString === this.capo) {
        fretUsedOnLowerString = undefined;
      }

      if (
        fingerUsedOnLowerString !== undefined &&
        fretUsedOnLowerString !== undefined
      ) {
        if (
          fret > fretUsedOnLowerString &&
          currentFingerIndex <= fingerUsedOnLowerString
        ) {
          return false;
        }

        if (
          fret < fretUsedOnLowerString &&
          currentFingerIndex >= fingerUsedOnLowerString
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
    minAllowedFretIndex: OptionalNumber,
    maxAllowedFretIndex: OptionalNumber
  ): ChordBuilderInfo[] | null => {
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

    const chordBuilderInfo: ChordBuilderInfo = {
      variation: recursiveData.chordBuilder,
      fingerAssignment: recursiveData.fingerAssignment,
      hasBarreOnIndexFinger:
        recursiveData.barreFretByFingerIndex[0] !== undefined, // 0 is the index finger
    };
    return [chordBuilderInfo];
  };

  private getFretLimitsForTheFirstTime = (fretIndex: number) => {
    const newMin = Math.max(
      this.capo + 1,
      fretIndex -
        getPossibleFullFingerStretch(
          Math.max(this.capo + 1, fretIndex - 5) // for more precise calculation we go 5 frets left, as the calculation is based on the leftmost fret of the range
        )
    );

    const newMax = Math.min(
      this.maxFretToProcess,
      fretIndex + getPossibleFullFingerStretch(fretIndex)
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
      ({
        availableFretByFingerIndex,
        fingerAssignment,
        maxFingerUsedByFret,
      }) => {
        return this.findChordNotesRecursive(
          stringIndex - 1,
          notesInChord,
          {
            chordBuilder,
            fingerAssignment,
            usedNotesSet,
            availableFretByFingerIndex,
            usedFretByFingerIndex: [...availableFretByFingerIndex], // the same as availableFretByFingerIndex at this point
            barreFretByFingerIndex: this.initArrayOfFingers(),
            maxFingerUsedByFret,
          },
          newMin,
          newMax
        );
      }
    );
  };

  private preventCurrentBarresToContinueOnHigherStrings(
    availableFretByFingerIndex: OptionalNumberArray,
    afterFret?: number
  ) {
    // if a string is muted it means that we cannot reuse the barre fingers anymore. We are setting all these fingers to -1 meaning they won't be reused.
    // for the fingers that are still not used we can continue using them (including as barre)
    for (let i = 0; i < NON_THUMB_FINGER_COUNT; i++) {
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
    barreFretByFingerIndex: OptionalNumberArray
  ) {
    for (let i = currentFingerIndex + 1; i < NON_THUMB_FINGER_COUNT; i++) {
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
    minAllowedFretIndex: OptionalNumber,
    maxAllowedFretIndex: OptionalNumber
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
      j <= (maxAllowedFretIndex ?? this.maxFretToProcess);
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
    let newMin: OptionalNumber;
    let newMax: OptionalNumber;

    // Handle open string case
    if (startingFret === this.capo) {
      startingOptions.push({
        availableFretByFingerIndex: this.initArrayOfFingers(),
        fingerAssignment: [...baseFingerAssignment],
        maxFingerUsedByFret: [],
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
          maxFingerUsedByFret: [],
        });
      }

      // Consider each finger as a starting option
      for (let i = 0; i < NON_THUMB_FINGER_COUNT; i++) {
        const availableFretByFingerIndex = this.initArrayOfFingers();
        availableFretByFingerIndex[i] = startingFret; // it means that we can use this finger only for this fret on the higher strings (barre)
        const currentFingerAssignment = [...baseFingerAssignment];
        const maxFingerUsedByFret: OptionalNumberArray = [];
        maxFingerUsedByFret[startingFret] = i;
        currentFingerAssignment[stringIndex] = i;
        startingOptions.push({
          availableFretByFingerIndex,
          fingerAssignment: currentFingerAssignment,
          maxFingerUsedByFret,
        } as StartingOption);
      }
    }
    return { startingOptions, newMin, newMax };
  }
}

const checkHasFurtherFingerOnLowerFrets = (
  recursiveData: RecursiveContainers,
  fret: number,
  currentFingerIndex: number
) => {
  const maxFingerUsedOnThisFret = recursiveData.maxFingerUsedByFret[fret];
  return (
    maxFingerUsedOnThisFret !== undefined &&
    currentFingerIndex < maxFingerUsedOnThisFret
  );
};

const isInvalidDistanceBetweenCurrentAndPreviousFingers = (
  currentFingerIndex: number,
  recursiveData: RecursiveContainers,
  fret: number
) => {
  for (
    let previousFingerIndex = currentFingerIndex - 1;
    previousFingerIndex >= 0;
    previousFingerIndex--
  ) {
    const fretUsedByPreviousFinger =
      recursiveData.usedFretByFingerIndex[previousFingerIndex];
    if (fretUsedByPreviousFinger !== undefined) {
      if (
        !isWithinAllowedDistance(
          fretUsedByPreviousFinger,
          fret,
          previousFingerIndex,
          currentFingerIndex
        )
      ) {
        return true;
      }

      // we check only the closest adjacent finger
      break;
    }
  }
  return false;
};

const isInvalidDistanceBetweenCurrentAndNextFingers = (
  currentFingerIndex: number,
  recursiveData: RecursiveContainers,
  fret: number
) => {
  for (
    let previousFingerIndex = currentFingerIndex + 1;
    previousFingerIndex < NON_THUMB_FINGER_COUNT;
    previousFingerIndex++
  ) {
    const fretUsedByNextFinger =
      recursiveData.usedFretByFingerIndex[previousFingerIndex];
    if (fretUsedByNextFinger !== undefined) {
      if (
        !isWithinAllowedDistance(
          fret,
          fretUsedByNextFinger,
          currentFingerIndex,
          previousFingerIndex
        )
      ) {
        return true;
      }

      // we check only the closest adjacent finger
      break;
    }
  }
  return false;
};

const checkHasSameFretUsedByDifferentFinger = (
  currentFingerIndex: number,
  recursiveData: RecursiveContainers,
  fret: number
) => {
  for (let i = 0; i < NON_THUMB_FINGER_COUNT; i++) {
    if (i === currentFingerIndex) {
      continue; // skip current fret
    }
    if (recursiveData.usedFretByFingerIndex[i] === fret) {
      return true;
    }
  }
  return false;
};
