import { NOTE_COUNT, Note, StringOctaveNote } from "@/app/data/notes";
import { CHROMATIC, SPECIAL, getScalePattern } from "@/app/data/scales";
import { getShiftedNote, parseStringToNotes } from "@/app/data/tunings";
import { generateNeckRepresentation } from "@/app/engine/generateNeckRepresentation";
import { addOrUpdateMapArray } from "@/app/helpers/mapHelper";
import { ChordMode, chordModes } from "@/utilities/chordModes";

const capo = 0;
const MAX_DISTANCE_IN_CHORD = 4;

const scalePattern = getScalePattern(SPECIAL, CHROMATIC); // all scales include 0, so it's omitted from the scales themselves
const tuning = "EBGDAE";

const baseNote = Note.E;
const neck = generateNeckRepresentation(
  scalePattern,
  parseStringToNotes(tuning),
  getShiftedNote(baseNote, tuning),
  baseNote
);
const absoluteMaxFretIndex = neck[0].length - 1;

type FingerPosition = StringOctaveNote | undefined;

type UltimateChordInfoVariation = {
  chordMode: ChordMode;
  fingerPositions: FingerPosition[];
  fingerPositionsString: string;
};

type UltimateSlashChordInfoVariation = UltimateChordInfoVariation & {
  bassNote: StringOctaveNote;
  name: string;
};

type ChordBuilderInfo = {
  variation: FingerPosition[];
  minAllowedFretIndex?: number;
  maxAllowedFretIndex?: number;
};

const buildIntervalsWithoutPerfectFifth = (chordMode: ChordMode) => {
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

const findChordNotesRecursive = (
  stringIndex: number,
  allNotesInChord: Set<Note>, // all the notes that should participate in chord
  chordBuilder: (StringOctaveNote | undefined)[], // recursively populated array with finger positions
  usedNotesSet: Set<Note>, // recursively populated set with used notes
  minAllowedFretIndex?: number,
  maxAllowedFretIndex?: number
): ChordBuilderInfo[] => {
  const currentString = neck[stringIndex];

  const matchingNotesOnThisString: FingerPosition[] = []; // these are the positions of the chord notes on the current string
  // Always take the open note into account
  const openStringNote = currentString[capo];
  if (openStringNote !== null && allNotesInChord.has(openStringNote.note)) {
    matchingNotesOnThisString.push(openStringNote);
  }

  for (
    let j = minAllowedFretIndex ?? capo + 1;
    j <= (maxAllowedFretIndex ?? absoluteMaxFretIndex);
    j++
  ) {
    const nonOpenStringNote = neck[stringIndex][j];
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

      if (stringOctaveNote !== undefined) {
        usedNotesSetCopy.add(stringOctaveNote.note);
        // calculate possible range for the next string
        const fret = stringOctaveNote.fret;

        if (
          minAllowedFretIndex === undefined ||
          maxAllowedFretIndex === undefined
        ) {
          // limits are not set yet (open notes were used on all the previous strings)

          if (fret > capo) {
            // we use a fret on non open string and need to adjust the limits for the next string
            ({ newMin, newMax } = getFretLimitsForTheFirstTime(fret));
          }
          // else they are left undefined
        } else if (fret === capo) {
          // leave limits intact
          newMin = minAllowedFretIndex;
          newMax = maxAllowedFretIndex;
        } else {
          // adjust according to the current note

          // we can allow max MAX_DISTANCE_IN_CHORD frets in any direction. If we go left from the note on the next string - then the max limit should be recalculated from the leftmost position and vice versa for the right direction
          const rightMostUsedFret = Math.max(fret, maxAllowedFretIndex);
          const leftMostUsedFret = Math.min(fret, minAllowedFretIndex);

          newMin = rightMostUsedFret - MAX_DISTANCE_IN_CHORD;
          newMax = leftMostUsedFret + MAX_DISTANCE_IN_CHORD;
        }
      } else {
        // this is a muted string
        // leave limits intact
        newMin = minAllowedFretIndex;
        newMax = maxAllowedFretIndex;
      }

      if (stringIndex > 0) {
        return findChordNotesRecursive(
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

const getSlashChordsForVariation = (
  variationInfo: ChordBuilderInfo,
  neckString: (StringOctaveNote | null)[],
  chordInfo: UltimateChordInfoVariation
) => {
  const minAllowedFretIndex = variationInfo.minAllowedFretIndex ?? capo + 1;
  const maxAllowedFretIndex =
    variationInfo.maxAllowedFretIndex ?? absoluteMaxFretIndex;
  // get the variation of chord with open string;
  const openStringNote = neckString[capo];
  if (openStringNote !== null) {
    applySlashChord(chordInfo, openStringNote);
  }

  for (
    let fretIndex = minAllowedFretIndex;
    fretIndex <= maxAllowedFretIndex;
    fretIndex++
  ) {
    const noteAtFret = neckString[fretIndex];
    if (noteAtFret !== null) {
      applySlashChord(chordInfo, noteAtFret);
    }
  }
};

const applySlashChord = (
  chordInfo: UltimateChordInfoVariation,
  bassNote: StringOctaveNote
) => {
  const originalVariation = chordInfo.fingerPositions;
  if (originalVariation[bassNote.string]?.note === bassNote.note) {
    // no need to apply a slash chord when the bass note is the same as in the original chord
    return;
  }

  const chordCopy = [...originalVariation];
  chordCopy[bassNote.string] = bassNote; // prepend open string note
  const slashChordInfo = getUltimateSlashChord(
    chordInfo.chordMode,
    chordCopy,
    bassNote
  );
  addOrUpdateMapArray(allSlashChords, slashChordInfo.name, slashChordInfo);
};

const getUltimateChord = (
  chordMode: ChordMode,
  fingerPositions: FingerPosition[]
): UltimateChordInfoVariation => {
  const fingerPositionsString = fingerPositions
    .reverse()
    .map((x) => x?.fret ?? "x")
    .join(",");
  return {
    chordMode,
    fingerPositions,
    fingerPositionsString,
  } as UltimateChordInfoVariation;
};

const getUltimateSlashChord = (
  chordMode: ChordMode,
  fingerPositions: FingerPosition[],
  bassNote: StringOctaveNote
): UltimateSlashChordInfoVariation => {
  const fingerPositionsString = fingerPositions
    .reverse()
    .map((x) => x?.fret ?? "x")
    .join(",");

  const chordName = chordMode.name || chordMode.description;
  const bassNoteName = Note[bassNote.note];
  const slashChordName = `${chordName}/${bassNoteName}`;
  return {
    chordMode,
    fingerPositions,
    fingerPositionsString,
    bassNote,
    name: slashChordName,
  } as UltimateSlashChordInfoVariation;
};

const getFretLimitsForTheFirstTime = (fretIndex: number) => {
  const newMin = Math.max(capo + 1, fretIndex - MAX_DISTANCE_IN_CHORD);

  const newMax = Math.min(
    absoluteMaxFretIndex,
    fretIndex + MAX_DISTANCE_IN_CHORD
  );
  return { newMin, newMax };
};

const processIntervalsInChordMode = (
  chordMode: ChordMode,
  intervalsToUse: number[]
) => {
  for (
    let stringIndex = tuning.length - 1; // starting from the lowest (thickest) string
    stringIndex >= intervalsToUse.length;
    stringIndex--
  ) {
    const neckString = neck[stringIndex];
    // loop through the strings starting from the lowest, ensuring there are strings to put all the notes of the chordIntervals
    for (let fretIndex = capo; fretIndex < absoluteMaxFretIndex; fretIndex++) {
      const currentStringOctaveNote = neckString[fretIndex];
      if (currentStringOctaveNote === null) {
        continue;
      }

      processFret(chordMode, intervalsToUse, currentStringOctaveNote);
    }
  }
};

const processChordMode = (chordMode: ChordMode) => {
  processIntervalsInChordMode(chordMode, chordMode.intervals);
  const intervalsWithoutPerfectFifth =
    buildIntervalsWithoutPerfectFifth(chordMode);
  if (intervalsWithoutPerfectFifth) {
    processIntervalsInChordMode(chordMode, intervalsWithoutPerfectFifth);
  }
};

const processFret = (
  chordMode: ChordMode,
  intervalsToUse: number[],
  stringOctaveNote: StringOctaveNote
) => {
  const notesInChord: Set<Note> = new Set(
    intervalsToUse.map((x) => (stringOctaveNote.note + x) % NOTE_COUNT)
  );
  const fretIndex = stringOctaveNote.fret;
  // console.log("Processing", currentStringOctaveNote);
  const chordBuilder: FingerPosition[] = [...Array(neck.length)];
  chordBuilder[stringOctaveNote.string] = stringOctaveNote;
  const usedNotesSet = new Set<Note>();
  usedNotesSet.add(stringOctaveNote.note);

  // fret limits for the first
  let newMin: number | undefined;
  let newMax: number | undefined;

  if (fretIndex !== capo) {
    // if we are not on the open string - then we can use only the adjacent several frets in each direction
    ({ newMin, newMax } = getFretLimitsForTheFirstTime(fretIndex));
  }

  const stringIndex = stringOctaveNote.string;
  // otherwise we are on the open string then we can use any fret for the next note
  // for each note and chord mode we build the realistic finger positions
  const realisticChordFingerPositions = findChordNotesRecursive(
    stringIndex - 1,
    notesInChord,
    chordBuilder,
    usedNotesSet,
    newMin,
    newMax
  );

  // finally we take the baseFretIndex and within the reasonable reach we change the first note of the chord with a different note - this way we get a slash chord
  // slash chords are variations of a chord with different bass note
  for (const variationInfo of realisticChordFingerPositions) {
    const chordInfo = getUltimateChord(chordMode, variationInfo.variation);
    addOrUpdateMapArray(allChords, chordInfo.chordMode.name, chordInfo);

    getSlashChordsForVariation(variationInfo, neck[stringIndex], chordInfo);
  }
};

const allChords = new Map<string, UltimateChordInfoVariation[]>();
const allSlashChords = new Map<string, UltimateSlashChordInfoVariation[]>();
chordModes.forEach((chordMode) => {
  if (chordMode.intervals.length > neck.length) {
    // cannot build this chord on the given guitar - it has more notes that the strings guitar has
    return;
  }

  processChordMode(chordMode);
});

console.log(
  Array.from(allChords.entries()).map(
    ([key, value]) =>
      `${key}: ${value.map((x) => x.fingerPositionsString).join(" | ")}`
  )
);
