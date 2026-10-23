import { NON_THUMB_FINGER_COUNT, THUMB } from "@/app/data/chordFingerConstants";
import { ChordBuilderInfo, FingerAssignment } from "@/app/data/chordModes";
import {
  NOTE_COUNT,
  Neck,
  NoteInChord,
  StringOctaveNote,
} from "@/app/data/notes";
import { getPossibleFullFingerStretch } from "@/app/engine/chords/generatorWorker/fretDistanceChecker";
import {
  noteBit,
  RecursiveChordGenerator,
} from "@/app/engine/chords/generatorWorker/recursiveChordGenerator";
import { SharedArrayCache } from "@/app/engine/chords/generatorWorker/sharedArrayCache";

type OptionalNumber = number | undefined;
type OptionalNumberArray = OptionalNumber[];
type StartingOption = {
  availableFretByFingerIndex: OptionalNumberArray;
  fingerAssignment: FingerAssignment;
  maxFingerUsedByFret: OptionalNumberArray;
  minAllowedFret: number | undefined;
  maxAllowedFret: number | undefined;
};

export class FretChordsGenerator {
  private capo: number;
  private maxFretToProcess: number;
  private neck: Neck;
  private recursiveChordGenerator: RecursiveChordGenerator;

  constructor(
    capo: number,
    neck: Neck,
    maxFretToProcess: number,
    sharedArrayCache: SharedArrayCache,
  ) {
    this.capo = capo;
    this.neck = neck;
    this.maxFretToProcess = maxFretToProcess;
    this.recursiveChordGenerator = new RecursiveChordGenerator(
      capo,
      neck,
      maxFretToProcess,
      this.getFretLimitsForTheFirstTime,
      sharedArrayCache,
    );
  }

  private initArrayOfFingers = () => Array(4).fill(undefined);

  private getFretLimitsForTheFirstTime = (fretIndex: number) => {
    const newMin = Math.max(
      this.capo + 1,
      fretIndex -
        getPossibleFullFingerStretch(
          Math.max(this.capo + 1, fretIndex - 5), // for more precise calculation we go 5 frets left, as the calculation is based on the leftmost fret of the range
        ),
    );

    const newMax = Math.min(
      this.maxFretToProcess,
      fretIndex + getPossibleFullFingerStretch(fretIndex),
    );
    return { newMin, newMax };
  };

  private getFretLimitsForTheFirstTimeWhenUsingThumb = (fretIndex: number) => {
    const newMin = Math.max(this.capo + 1, fretIndex - 3);

    const newMax = Math.min(this.maxFretToProcess, fretIndex + 3);
    return { newMin, newMax };
  };

  processFret = (
    intervalsToUse: number[],
    stringOctaveNote: StringOctaveNote,
  ) => {
    let requiredNotesMask = 0;
    for (const interval of intervalsToUse) {
      requiredNotesMask |= noteBit(
        (stringOctaveNote.note + interval) % NOTE_COUNT,
      );
    }
    const chordBuilder: NoteInChord[] = [...Array(this.neck.length)];
    chordBuilder[stringOctaveNote.string] = stringOctaveNote;

    const stringIndex = stringOctaveNote.string;
    const startingOptions = this.getStartingOptions(
      stringOctaveNote,
      stringIndex,
    );

    const results: ChordBuilderInfo[] = [];
    for (const {
      availableFretByFingerIndex,
      fingerAssignment,
      maxFingerUsedByFret,
      minAllowedFret,
      maxAllowedFret,
    } of startingOptions) {
      this.recursiveChordGenerator.findChordNotesRecursive(
        stringIndex - 1,
        requiredNotesMask,
        {
          chordBuilder,
          fingerAssignment,
          usedNotesMask: noteBit(stringOctaveNote.note),
          availableFretByFingerIndex,
          usedFretByFingerIndex: [...availableFretByFingerIndex], // the same as availableFretByFingerIndex at this point
          barreFretByFingerIndex: this.initArrayOfFingers(),
          maxFingerUsedByFret,
        },
        minAllowedFret,
        maxAllowedFret,
        results,
      );
    }
    return results;
  };

  private getStartingOptions(
    stringOctaveNote: StringOctaveNote,
    stringIndex: number,
  ) {
    const startingFret = stringOctaveNote.fret;

    const startingOptions: StartingOption[] = [];

    // Initialize fingerAssignment with the correct length
    const baseFingerAssignment: FingerAssignment = new Array(this.neck.length);

    // Handle open string case
    if (startingFret === this.capo) {
      startingOptions.push({
        availableFretByFingerIndex: this.initArrayOfFingers(),
        fingerAssignment: [...baseFingerAssignment],
        maxFingerUsedByFret: [],
        minAllowedFret: undefined,
        maxAllowedFret: undefined,
      });
    } else {
      if (stringIndex === this.neck.length - 1) {
        // if we are not on the open string - then we can use only the adjacent several frets in each direction
        const { newMin, newMax } =
          this.getFretLimitsForTheFirstTimeWhenUsingThumb(startingFret);
        // Lowest string, consider thumb as an option
        const thumbFingerAssignment = [...baseFingerAssignment];
        thumbFingerAssignment[stringIndex] = THUMB; // Assign thumb to the lowest string. Note that this branch of code excludes open strings (this case it processed separately)
        startingOptions.push({
          availableFretByFingerIndex: this.initArrayOfFingers(),
          fingerAssignment: thumbFingerAssignment,
          maxFingerUsedByFret: [],
          minAllowedFret: newMin,
          maxAllowedFret: newMax,
        });
      }

      // if we are not on the open string - then we can use only the adjacent several frets in each direction
      const { newMin, newMax } =
        this.getFretLimitsForTheFirstTime(startingFret);
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
          minAllowedFret: newMin,
          maxAllowedFret: newMax,
        } as StartingOption);
      }
    }
    return startingOptions;
  }
}
