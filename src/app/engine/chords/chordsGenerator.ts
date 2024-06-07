import {
  ChordMode,
  NoteChordMode,
  NoteChords,
  chordModesArray,
  isAdvancedMode,
} from "@/app/data/chordModes";
import { cartesian } from "@/app/helpers/cartesian";
import { Chord, Note, StringOctaveNote } from "../../data/notes";
import {
  calculateAverage,
  findObjectWithMinValue,
} from "../../helpers/arrayHelper";
import { FRET_COUNT, NOTE_COUNT, Neck } from "../generateNeckRepresentation";

export const MAX_DISTANCE_IN_CHORD = 4;

// Function to generate a chord based on the root note and the intervals
function generateChord(note: Note, intervals: number[]): Note[] {
  const chordNotes: Note[] = [];
  for (const interval of intervals) {
    const noteIndex = (note + interval) % 12;
    chordNotes.push(noteIndex);
  }
  return chordNotes;
}

// Function to find the next occurrence of a note in the chord on the given string within the specified range
const findNextNotesInChord = (
  stringIndex: number,
  baseFretIndex: number, // we allow not more than maxFretDistance distance from this fret in any direction unless it's 0 (then any can suit)
  noteToFind: Note,
  neck: Neck,
  capo: number
): StringOctaveNote[] => {
  const notes = [];

  const openStringFretIndex = capo;

  // Always take the open note into account
  const note = neck[stringIndex][openStringFretIndex];
  if (note?.note === noteToFind) {
    notes.push(note);
  }

  for (
    let j = Math.max(
      openStringFretIndex + 1,
      baseFretIndex - MAX_DISTANCE_IN_CHORD
    );
    j <=
    Math.min(
      baseFretIndex === 0
        ? NOTE_COUNT - 1
        : baseFretIndex + MAX_DISTANCE_IN_CHORD, // if the note on the previous string was open (fret index === 0) - then we search for the next base fret index on the next string (therefore allowing any fret of the first octave 0 - 11)
      neck[stringIndex].length - 1
    );
    j++
  ) {
    const note = neck[stringIndex][j];
    if (note?.note === noteToFind) {
      notes.push(note);
    }
  }
  return notes;
};

export const generateAllChords = (
  neck: Neck,
  useAdvancedChords: boolean,
  capo: number
): NoteChords[] => {
  const allChords: NoteChords[] = [];

  // Loop through all notes
  for (let note = 0; note < NOTE_COUNT; note++) {
    const noteChords: NoteChordMode[] = [];

    // Generate all chord variations for the current note
    for (const [mode, intervals] of chordModesArray) {
      if (!useAdvancedChords && isAdvancedMode(mode)) {
        continue;
      }

      const chordVariations = intervals.flatMap((interval) =>
        generateChordVariations(capo, note, interval, neck, mode)
      );
      noteChords.push({ mode, variations: chordVariations });
    }

    // Add the generated chords for the current note to the result
    allChords.push({ note, modes: noteChords });
  }

  return allChords;
};

// Function to generate all the variations of a chord on the guitar neck
const generateChordVariations = (
  capo: number, // chords cannot got below this index
  baseNote: Note,
  interval: number[], // Notes that constitute the chord
  neck: Neck, // Representation of the guitar neck
  mode: ChordMode
): Chord[] => {
  // TODO: each variation should specify X notes - and this number should be adjusted to use NON-x chars
  const getMinNotesInChord = () => {
    switch (mode) {
      case ChordMode.Add9:
      case ChordMode.MinorAdd9:
      case ChordMode.SixthAdd9:
      case ChordMode.SixthMinorAdd9:
      case ChordMode.NinthMajor:
      case ChordMode.NinthMinor:
      case ChordMode.NinthMinorMajor:
        return 6;
      case ChordMode.Suspended2:
      case ChordMode.SixthMinorMajor:
        return 5;
    }
    return 4;
  };

  const minConsecutiveNotesInValidChord = getMinNotesInChord();
  const chordNotes = generateChord(baseNote, interval);
  const chordVariations: Chord[] = getChordVariations(
    neck,
    capo,
    baseNote,
    chordNotes,
    minConsecutiveNotesInValidChord
  );

  // if (chordNotes[0] === Note["C"] && mode === ChordMode.Major) {
  //   const tuning = tuningValue;
  //   debugger;
  // }
  return chordVariations;
};

export const getClosestVariation = (chordVariations: Chord[]) => {
  if (!chordVariations.length) {
    return null;
  }
  const variationAvgDistances = chordVariations.map((variation) => {
    const distances = variation.map(
      // lower strings get more priority
      // TODO: Hardcoded string count
      (note) => note.fret + (6 - note.string * 0.5)
    );
    const avgDistance = calculateAverage(distances);
    return { object: variation, number: avgDistance };
  });
  return findObjectWithMinValue(variationAvgDistances);
};

const getPossibleNotes = (
  stringOctaveNote: StringOctaveNote,
  fretIndex: number,
  chordNotes: Note[],
  stringIndex: number,
  neck: Neck,
  capo: number,
  endFretForLookup: number
) => {
  const possibleNotesForThisBaseNote: StringOctaveNote[][] = [];
  possibleNotesForThisBaseNote.push([stringOctaveNote]);

  // This variable will be changing for each new string
  let baseFretIndex = fretIndex;

  // Find the next notes in the chord on the upper strings
  for (let i = 1; i < chordNotes.length && stringIndex - i >= 0; i++) {
    const notesOnHigherString = findNextNotesInChord(
      stringIndex - i, // search for the next note on the next string
      baseFretIndex,
      chordNotes[i],
      neck,
      capo
    );

    // If the previous fret index was an open string (0) then we need to set a new base fret index on a higher string to arrange fingers
    // Once the index is found - it remains base for the whole chord
    // Without this it's not possible to arrange fingers for a Hendrix chord which is 0 on last string and 7 on last but one
    if (baseFretIndex === capo) {
      for (const note of notesOnHigherString) {
        if (note.fret > capo && note.fret < endFretForLookup) {
          baseFretIndex = note.fret;
          break;
        }
      }
    }
    possibleNotesForThisBaseNote.push(notesOnHigherString);
  }
  return possibleNotesForThisBaseNote;
};

const applyCartesianProduct = (
  possibleNotesForThisBaseNote: StringOctaveNote[][],
  minConsecutiveNotesInValidChord: number,
  chordVariations: Chord[]
) => {
  // cartesianProductOf([1, 2], [3, 4], ['a'])
  // -> [[1,3,"a"],[1,3,"b"],[1,4,"a"],[1,4,"b"],[2,3,"a"],[2,3,"b"],[2,4,"a"],[2,4,"b"]]
  const cartesianProduct = cartesian(...possibleNotesForThisBaseNote);
  // console.log(cartesianProduct);
  if (cartesianProduct?.length) {
    for (const combination of cartesianProduct) {
      if (
        combination.length >= minConsecutiveNotesInValidChord &&
        // first n notes of the chord should be present to consider it valid
        // TODO: different modes of chord might require more notes
        [...combination]
          .slice(0, minConsecutiveNotesInValidChord)
          .every((element) => element !== null)
      ) {
        chordVariations.push(combination.filter((x) => x) as Chord);
      }
    }
  }
};

const getChordVariations = (
  neck: Neck,
  capo: number,
  baseNote: Note,
  chordNotes: Note[],
  minConsecutiveNotesInValidChord: number
) => {
  const chordVariations: Chord[] = [];

  // Iterate through each string from bottom to top
  for (let stringIndex = neck.length - 1; stringIndex >= 0; stringIndex--) {
    const string = neck[stringIndex];

    // Find the first note in the chord on the current string - limit at 12 to avoid unrealistic chords
    // const endFretForLookup = Math.min(capo + NOTE_COUNT + 1, FRET_COUNT);
    const endFretForLookup = FRET_COUNT; // allow all notes instead. Disregard the above comment

    for (let fretIndex = capo; fretIndex < endFretForLookup; fretIndex++) {
      const stringOctaveNote = string[fretIndex];
      if (stringOctaveNote !== null && stringOctaveNote.note === baseNote) {
        const possibleNotesForThisBaseNote: StringOctaveNote[][] =
          getPossibleNotes(
            stringOctaveNote,
            fretIndex,
            chordNotes,
            stringIndex,
            neck,
            capo,
            endFretForLookup
          );

        if (
          possibleNotesForThisBaseNote.length < minConsecutiveNotesInValidChord
        ) {
          continue;
        }

        applyCartesianProduct(
          possibleNotesForThisBaseNote,
          minConsecutiveNotesInValidChord,
          chordVariations
        );
      }
    }
  }
  return chordVariations;
};
