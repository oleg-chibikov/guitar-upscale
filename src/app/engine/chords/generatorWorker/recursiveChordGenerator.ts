import { NON_THUMB_FINGER_COUNT, THUMB } from "@/app/data/chordFingerConstants";
import { ChordBuilderInfo, FingerAssignment } from "@/app/data/chordModes";
import { Neck, NoteInChord, StringOctaveNote } from "@/app/data/notes";
import {
  getPossibleFullFingerStretch,
  isWithinAllowedDistance,
} from "@/app/engine/chords/generatorWorker/fretDistanceChecker";
import { SharedArrayCache } from "@/app/engine/chords/generatorWorker/sharedArrayCache";

type OptionalNumber = number | undefined;
type OptionalNumberArray = OptionalNumber[];

// The search mutates this state in place and restores it after each branch, so no branch copies it.
export type RecursiveContainers = {
  availableFretByFingerIndex: OptionalNumberArray; // array of 4 numbers for each finger except the thumb. undefined means this finger can be used for any fret. Otherwise we limit it only to a single fret onwards (barre). It can be set to -1 meaning this finger cannot be used anymore
  usedFretByFingerIndex: OptionalNumberArray; // the same as previous, but cannot be set to -1
  chordBuilder: NoteInChord[]; // notes that will be used in chord
  fingerAssignment: FingerAssignment; // how fingers are assigned to the strings
  usedNotesMask: number; // bit N is set when note N is already used in the chord that's being built
  barreFretByFingerIndex: OptionalNumberArray; // array of 4 numbers for each finger except the thumb. Having a value here means that this finger does a barre on a certain fret (uses 2+ strings)
  maxFingerUsedByFret: OptionalNumberArray; // this prevents a lower finger to be placed on higher string for the same fret. Although technically possible (but hard to put fingers in such manner) such finger arrangement rarely makes practical sense
};

export const noteBit = (note: number) => 1 << note;

const countBits = (mask: number) => {
  let count = 0;
  while (mask !== 0) {
    mask &= mask - 1;
    count++;
  }
  return count;
};

export class RecursiveChordGenerator {
  private capo: number;
  private maxFretToProcess: number;
  private neck: Neck;
  private getFretLimits: (fretIndex: number) => {
    newMin: number;
    newMax: number;
  };
  private sharedArrayCache: SharedArrayCache;

  constructor(
    capo: number,
    neck: Neck,
    maxFretToProcess: number,
    getLimits: (fretIndex: number) => {
      newMin: number;
      newMax: number;
    },
    sharedArrayCache: SharedArrayCache,
  ) {
    this.capo = capo;
    this.neck = neck;
    this.maxFretToProcess = maxFretToProcess;
    this.getFretLimits = getLimits;
    this.sharedArrayCache = sharedArrayCache;
  }

  // this method recursively takes all the matching notes on the next string (from bottom to top) and builds multiple variations of the chord by scanning strings one by one
  findChordNotesRecursive = (
    stringIndex: number,
    requiredNotesMask: number, // all the notes that should participate in chord
    state: RecursiveContainers,
    minAllowedFretIndex: OptionalNumber,
    maxAllowedFretIndex: OptionalNumber,
    results: ChordBuilderInfo[],
  ): void => {
    // Each string left adds one note at most. Too few strings for the missing notes means no chord down this branch.
    if (countBits(requiredNotesMask & ~state.usedNotesMask) > stringIndex + 1) {
      return;
    }

    const neckString = this.neck[stringIndex];

    // Always take the open note into account
    const openStringNote = neckString[this.capo];
    if (
      openStringNote !== null &&
      (requiredNotesMask & noteBit(openStringNote.note)) !== 0
    ) {
      this.tryOpenString(
        stringIndex,
        openStringNote,
        requiredNotesMask,
        state,
        minAllowedFretIndex,
        maxAllowedFretIndex,
        results,
      );
    }

    const lastFret = maxAllowedFretIndex ?? this.maxFretToProcess;
    for (
      let fret = minAllowedFretIndex ?? this.capo + 1;
      fret <= lastFret;
      fret++
    ) {
      const stringOctaveNote = neckString[fret];
      if (
        stringOctaveNote !== null &&
        (requiredNotesMask & noteBit(stringOctaveNote.note)) !== 0
      ) {
        this.tryFrettedNote(
          stringIndex,
          stringOctaveNote,
          requiredNotesMask,
          state,
          minAllowedFretIndex,
          maxAllowedFretIndex,
          results,
        );
      }
    }

    this.tryMutedString(
      stringIndex,
      requiredNotesMask,
      state,
      minAllowedFretIndex,
      maxAllowedFretIndex,
      results,
    );
  };

  private tryMutedString(
    stringIndex: number,
    requiredNotesMask: number,
    state: RecursiveContainers,
    minAllowedFretIndex: OptionalNumber,
    maxAllowedFretIndex: OptionalNumber,
    results: ChordBuilderInfo[],
  ) {
    // we cannot continue any existing barre anymore when muting a string. if it exists we cannot continue as the barre has to occupy all the strings up to the highest
    if (
      this.checkIfThereIsBarreOnHigherFret(
        -1, // check all fingers
        this.capo,
        state.barreFretByFingerIndex,
      )
    ) {
      return;
    }

    const available = state.availableFretByFingerIndex;
    const [a0, a1, a2, a3] = available;

    this.preventCurrentBarresToContinueOnHigherStrings(available);

    this.processNoteRecursively(
      stringIndex,
      requiredNotesMask,
      state,
      minAllowedFretIndex, // leave limits and previously used finger/fret intact
      maxAllowedFretIndex,
      results,
    );

    available[0] = a0;
    available[1] = a1;
    available[2] = a2;
    available[3] = a3;
  }

  private tryOpenString(
    stringIndex: number,
    stringOctaveNote: StringOctaveNote,
    requiredNotesMask: number,
    state: RecursiveContainers,
    minAllowedFretIndex: OptionalNumber,
    maxAllowedFretIndex: OptionalNumber,
    results: ChordBuilderInfo[],
  ) {
    // we cannot continue any existing barre anymore when using an open string. if it exists we cannot continue as the barre has to occupy all the strings up to the highest
    if (
      this.checkIfThereIsBarreOnHigherFret(
        -1, // check all fingers
        stringOctaveNote.fret,
        state.barreFretByFingerIndex,
      )
    ) {
      return;
    }

    const available = state.availableFretByFingerIndex;
    const [a0, a1, a2, a3] = available;
    const previousMask = state.usedNotesMask;

    state.usedNotesMask |= noteBit(stringOctaveNote.note);
    state.chordBuilder[stringIndex] = stringOctaveNote;

    this.preventCurrentBarresToContinueOnHigherStrings(available);

    this.processNoteRecursively(
      stringIndex,
      requiredNotesMask,
      state,
      minAllowedFretIndex, // leave limits intact
      maxAllowedFretIndex,
      results,
    );

    available[0] = a0;
    available[1] = a1;
    available[2] = a2;
    available[3] = a3;
    state.usedNotesMask = previousMask;
    state.chordBuilder[stringIndex] = undefined;
  }

  // we should try putting all available fingers on each note
  private tryFrettedNote(
    stringIndex: number,
    stringOctaveNote: StringOctaveNote,
    requiredNotesMask: number,
    state: RecursiveContainers,
    minAllowedFretIndex: OptionalNumber,
    maxAllowedFretIndex: OptionalNumber,
    results: ChordBuilderInfo[],
  ) {
    const fret = stringOctaveNote.fret;
    const available = state.availableFretByFingerIndex;

    for (
      let currentFingerIndex = 0;
      currentFingerIndex < NON_THUMB_FINGER_COUNT;
      currentFingerIndex++
    ) {
      const theOnlyAllowedFret = available[currentFingerIndex];
      if (theOnlyAllowedFret !== undefined && fret !== theOnlyAllowedFret) {
        // if we have already used this finger - it means we can only use it on the same fret on a higher string (barre). In any other case we cannot apply this finger anymore
        continue;
      }

      // check which fret is used on the closest previous finger
      if (
        this.checkHasFurtherFingerOnLowerFrets(state, fret, currentFingerIndex)
      ) {
        continue;
      }

      if (
        !this.checkIfFingerPositionIsValid(
          stringIndex,
          fret,
          currentFingerIndex,
          state,
        )
      ) {
        continue;
      }

      if (
        this.checkIfThereIsBarreOnHigherFret(
          currentFingerIndex,
          fret,
          state.barreFretByFingerIndex,
        )
      ) {
        continue;
      }

      if (
        this.isInvalidDistanceBetweenCurrentAndPreviousFingers(
          currentFingerIndex,
          state,
          fret,
        )
      ) {
        continue;
      }

      if (
        this.isInvalidDistanceBetweenCurrentAndNextFingers(
          currentFingerIndex,
          state,
          fret,
        )
      ) {
        continue;
      }

      const isBarreOnCurrentFret =
        theOnlyAllowedFret !== undefined && fret === theOnlyAllowedFret;

      // having a barre and another finger on the same fret is highly unlikely - skipping this chord
      if (
        isBarreOnCurrentFret &&
        this.checkHasSameFretUsedByDifferentFinger(
          currentFingerIndex,
          state,
          fret,
        )
      ) {
        continue;
      }

      // calculate fret limits for the next string
      const { newMin, newMax } = this.updateMinAndMaxFretPositions(
        minAllowedFretIndex,
        maxAllowedFretIndex,
        fret,
      );

      const [a0, a1, a2, a3] = available;
      const previousUsedFret = state.usedFretByFingerIndex[currentFingerIndex];
      const previousBarreFret =
        state.barreFretByFingerIndex[currentFingerIndex];
      const previousMask = state.usedNotesMask;
      const previousMaxFinger = state.maxFingerUsedByFret[fret];

      state.usedNotesMask |= noteBit(stringOctaveNote.note);
      state.fingerAssignment[stringIndex] = currentFingerIndex;
      state.chordBuilder[stringIndex] = stringOctaveNote;
      state.maxFingerUsedByFret[fret] = Math.max(
        previousMaxFinger ?? currentFingerIndex,
        currentFingerIndex,
      );

      // this finger can only be used for barre on higher strings
      if (theOnlyAllowedFret === undefined) {
        available[currentFingerIndex] = fret;
        state.usedFretByFingerIndex[currentFingerIndex] = fret;
      }

      if (isBarreOnCurrentFret) {
        state.barreFretByFingerIndex[currentFingerIndex] = fret;
      }

      this.preventCurrentBarresToContinueOnHigherStrings(available, fret);

      this.processNoteRecursively(
        stringIndex,
        requiredNotesMask,
        state,
        newMin,
        newMax,
        results,
      );

      available[0] = a0;
      available[1] = a1;
      available[2] = a2;
      available[3] = a3;
      state.usedFretByFingerIndex[currentFingerIndex] = previousUsedFret;
      state.barreFretByFingerIndex[currentFingerIndex] = previousBarreFret;
      state.usedNotesMask = previousMask;
      state.fingerAssignment[stringIndex] = undefined;
      state.chordBuilder[stringIndex] = undefined;
      state.maxFingerUsedByFret[fret] = previousMaxFinger;
    }
  }

  private updateMinAndMaxFretPositions(
    minAllowedFretIndex: OptionalNumber,
    maxAllowedFretIndex: OptionalNumber,
    fret: number,
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
      ({ newMin, newMax } = this.getFretLimits(fret));
    } else {
      // else they are left undefined
      // we can allow max MAX_DISTANCE_IN_CHORD frets in any direction (it depends on the current fret). If we go left from the note on the next string - then the max limit should be recalculated from the leftmost position and vice versa for the right direction

      newMin = Math.max(
        fret - getPossibleFullFingerStretch(minAllowedFretIndex),
        minAllowedFretIndex,
      );

      newMax = Math.min(
        fret + getPossibleFullFingerStretch(fret),
        maxAllowedFretIndex,
      );
    }
    return { newMin, newMax };
  }

  private checkIfFingerPositionIsValid(
    currentStringIndex: number,
    fret: number,
    currentFingerIndex: number,
    state: RecursiveContainers,
  ) {
    // going through each of the previous strings
    for (
      let lowerStringIndex = currentStringIndex + 1;
      lowerStringIndex < this.neck.length;
      lowerStringIndex++
    ) {
      // if we used a finger 1 on a lower string at a fret 5 it means that we can use fingers 2 and 3 on a frets >= 5 and we can use finger 0 on fret <= 5
      let fingerUsedOnLowerString = state.fingerAssignment[lowerStringIndex];
      // The thumb wraps around the neck behind the index finger, so it ranks below finger 0
      if (fingerUsedOnLowerString === THUMB) {
        fingerUsedOnLowerString = -1;
      }
      let fretUsedOnLowerString = state.chordBuilder[lowerStringIndex]?.fret;
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
  private processNoteRecursively(
    stringIndex: number,
    requiredNotesMask: number,
    state: RecursiveContainers,
    minAllowedFretIndex: OptionalNumber,
    maxAllowedFretIndex: OptionalNumber,
    results: ChordBuilderInfo[],
  ) {
    if (stringIndex > 0) {
      this.findChordNotesRecursive(
        stringIndex - 1,
        requiredNotesMask,
        state,
        minAllowedFretIndex,
        maxAllowedFretIndex,
        results,
      );
      return;
    }
    // this branch returns the final result
    if ((state.usedNotesMask & requiredNotesMask) !== requiredNotesMask) {
      return;
    }

    results.push({
      variation: this.sharedArrayCache.getVariation(state.chordBuilder),
      fingerAssignment: this.sharedArrayCache.getFingerAssignment(
        state.fingerAssignment,
      ),
      hasBarreOnIndexFinger: state.barreFretByFingerIndex[0] !== undefined, // 0 is the index finger
    });
  }

  private preventCurrentBarresToContinueOnHigherStrings(
    availableFretByFingerIndex: OptionalNumberArray,
    afterFret?: number,
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
    barreFretByFingerIndex: OptionalNumberArray,
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

  private checkHasFurtherFingerOnLowerFrets = (
    state: RecursiveContainers,
    fret: number,
    currentFingerIndex: number,
  ) => {
    const maxFingerUsedOnThisFret = state.maxFingerUsedByFret[fret];
    return (
      maxFingerUsedOnThisFret !== undefined &&
      currentFingerIndex < maxFingerUsedOnThisFret
    );
  };

  private isInvalidDistanceBetweenCurrentAndPreviousFingers = (
    currentFingerIndex: number,
    state: RecursiveContainers,
    fret: number,
  ) => {
    for (
      let previousFingerIndex = currentFingerIndex - 1;
      previousFingerIndex >= 0;
      previousFingerIndex--
    ) {
      const fretUsedByPreviousFinger =
        state.usedFretByFingerIndex[previousFingerIndex];
      if (fretUsedByPreviousFinger !== undefined) {
        if (
          !isWithinAllowedDistance(
            fretUsedByPreviousFinger,
            fret,
            previousFingerIndex,
            currentFingerIndex,
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

  private isInvalidDistanceBetweenCurrentAndNextFingers = (
    currentFingerIndex: number,
    state: RecursiveContainers,
    fret: number,
  ) => {
    for (
      let previousFingerIndex = currentFingerIndex + 1;
      previousFingerIndex < NON_THUMB_FINGER_COUNT;
      previousFingerIndex++
    ) {
      const fretUsedByNextFinger =
        state.usedFretByFingerIndex[previousFingerIndex];
      if (fretUsedByNextFinger !== undefined) {
        if (
          !isWithinAllowedDistance(
            fret,
            fretUsedByNextFinger,
            currentFingerIndex,
            previousFingerIndex,
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

  private checkHasSameFretUsedByDifferentFinger = (
    currentFingerIndex: number,
    state: RecursiveContainers,
    fret: number,
  ) => {
    for (let i = 0; i < NON_THUMB_FINGER_COUNT; i++) {
      if (i === currentFingerIndex) {
        continue; // skip current fret
      }
      if (state.usedFretByFingerIndex[i] === fret) {
        return true;
      }
    }
    return false;
  };
}
