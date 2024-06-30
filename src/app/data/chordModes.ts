import { Chord, Note, getNoteText } from "@/app/data/notes";
import { ChordPreferredVariations } from "@/app/engine/chords/chordVariationHelper";

export interface ChordMode {
  description: string; // Description of the chord
  intervals: number[]; // List of intervals in semitones from the root note
  name: string; // Commonly used name for the chord
  triad: string; // Type of triad (e.g., Major, Minor, Diminished, Augmented, Suspended)
  extensions: string[]; // List of extensions (e.g., "maj7", "9")
  canSkipPerfectFifth: boolean; // Indicates if the perfect fifth can be omitted
}

export const chordModes: ChordMode[] = [
  {
    description: "Major",
    intervals: [0, 4, 7],
    name: "",
    triad: "Major",
    extensions: [],
    canSkipPerfectFifth: false,
  },
  {
    description: "Minor",
    intervals: [0, 3, 7],
    name: "m",
    triad: "Minor",
    extensions: [],
    canSkipPerfectFifth: false,
  },
  {
    description: "Diminished",
    intervals: [0, 3, 6],
    name: "dim",
    triad: "Diminished",
    extensions: [],
    canSkipPerfectFifth: false,
  },
  {
    description: "Augmented",
    intervals: [0, 4, 8],
    name: "aug",
    triad: "Augmented",
    extensions: [],
    canSkipPerfectFifth: false,
  },
  {
    description: "Suspended 2nd",
    intervals: [0, 2, 7],
    name: "sus2",
    triad: "Suspended",
    extensions: [],
    canSkipPerfectFifth: false,
  },
  {
    description: "Suspended 4th",
    intervals: [0, 5, 7],
    name: "sus4",
    triad: "Suspended",
    extensions: [],
    canSkipPerfectFifth: false,
  },
  {
    description: "Major 7th",
    intervals: [0, 4, 7, 11],
    name: "maj7",
    triad: "Major",
    extensions: ["maj7"],
    canSkipPerfectFifth: false,
  },
  {
    description: "Minor 7th",
    intervals: [0, 3, 7, 10],
    name: "m7",
    triad: "Minor",
    extensions: ["7"],
    canSkipPerfectFifth: false,
  },
  {
    description: "Dominant 7th",
    intervals: [0, 4, 7, 10],
    name: "7",
    triad: "Major",
    extensions: ["7"],
    canSkipPerfectFifth: false,
  },
  {
    description: "Diminished 7th",
    intervals: [0, 3, 6, 9],
    name: "dim7",
    triad: "Diminished",
    extensions: ["dim7"],
    canSkipPerfectFifth: false,
  },
  {
    description: "Half-Diminished 7th",
    intervals: [0, 3, 6, 10],
    name: "m7b5",
    triad: "Diminished",
    extensions: ["7"],
    canSkipPerfectFifth: false,
  },
  {
    description: "Augmented 7th",
    intervals: [0, 4, 8, 10],
    name: "aug7",
    triad: "Augmented",
    extensions: ["7"],
    canSkipPerfectFifth: false,
  },
  {
    description: "Minor Major 7",
    intervals: [0, 3, 7, 11],
    name: "mMaj7",
    triad: "Minor",
    extensions: ["maj7"],
    canSkipPerfectFifth: false,
  },
  {
    description: "Major 9th",
    intervals: [0, 4, 7, 11, 14],
    name: "maj9",
    triad: "Major",
    extensions: ["maj7", "9"],
    canSkipPerfectFifth: false,
  },
  {
    description: "Minor 9th",
    intervals: [0, 3, 7, 10, 14],
    name: "m9",
    triad: "Minor",
    extensions: ["7", "9"],
    canSkipPerfectFifth: false,
  },
  {
    description: "Dominant 9th",
    intervals: [0, 4, 7, 10, 14],
    name: "9",
    triad: "Major",
    extensions: ["7", "9"],
    canSkipPerfectFifth: false,
  },
  {
    description: "Minor Major 9",
    intervals: [0, 3, 7, 11, 14],
    name: "mMaj9",
    triad: "Minor",
    extensions: ["maj7", "9"],
    canSkipPerfectFifth: false,
  },
  {
    description: "Major 11th",
    intervals: [0, 4, 7, 11, 14, 17],
    name: "maj11",
    triad: "Major",
    extensions: ["maj7", "9", "11"],
    canSkipPerfectFifth: true,
  },
  {
    description: "Minor 11th",
    intervals: [0, 3, 7, 10, 14, 17],
    name: "m11",
    triad: "Minor",
    extensions: ["7", "9", "11"],
    canSkipPerfectFifth: true,
  },
  {
    description: "Dominant 11th",
    intervals: [0, 4, 7, 10, 14, 17],
    name: "11",
    triad: "Major",
    extensions: ["7", "9", "11"],
    canSkipPerfectFifth: true,
  },
  {
    description: "Major 13th",
    intervals: [0, 4, 7, 11, 14, 17, 21],
    name: "maj13",
    triad: "Major",
    extensions: ["maj7", "9", "11", "13"],
    canSkipPerfectFifth: true,
  },
  {
    description: "Minor 13th",
    intervals: [0, 3, 7, 10, 14, 17, 21],
    name: "m13",
    triad: "Minor",
    extensions: ["7", "9", "11", "13"],
    canSkipPerfectFifth: true,
  },
  {
    description: "Dominant 13th",
    intervals: [0, 4, 7, 10, 14, 17, 21],
    name: "13",
    triad: "Major",
    extensions: ["7", "9", "11", "13"],
    canSkipPerfectFifth: true,
  },
  {
    description: "6th",
    intervals: [0, 4, 7, 9],
    name: "6",
    triad: "Major",
    extensions: ["6"],
    canSkipPerfectFifth: false,
  },
  {
    description: "Minor 6th",
    intervals: [0, 3, 7, 9],
    name: "m6",
    triad: "Minor",
    extensions: ["6"],
    canSkipPerfectFifth: false,
  },
  {
    description: "6/9",
    intervals: [0, 4, 7, 9, 14],
    name: "6/9",
    triad: "Major",
    extensions: ["6", "9"],
    canSkipPerfectFifth: false,
  },
  {
    description: "7sus4",
    intervals: [0, 5, 7, 10],
    name: "7sus4",
    triad: "Suspended",
    extensions: ["7"],
    canSkipPerfectFifth: false,
  },
  {
    description: "9sus4",
    intervals: [0, 5, 7, 10, 14],
    name: "9sus4",
    triad: "Suspended",
    extensions: ["7", "9"],
    canSkipPerfectFifth: true,
  },
  {
    description: "13sus4",
    intervals: [0, 5, 7, 10, 14, 17, 21],
    name: "13sus4",
    triad: "Suspended",
    extensions: ["7", "9", "11", "13"],
    canSkipPerfectFifth: true,
  },
  {
    description: "7b5",
    intervals: [0, 4, 6, 10],
    name: "7b5",
    triad: "Major",
    extensions: ["7", "b5"],
    canSkipPerfectFifth: false,
  },
  {
    description: "7#5",
    intervals: [0, 4, 8, 10],
    name: "7#5",
    triad: "Augmented",
    extensions: ["7"],
    canSkipPerfectFifth: false,
  },
  {
    description: "7b9",
    intervals: [0, 4, 7, 10, 13],
    name: "7b9",
    triad: "Major",
    extensions: ["7", "b9"],
    canSkipPerfectFifth: true,
  },
  {
    description: "7#9",
    intervals: [0, 4, 7, 10, 15],
    name: "7#9",
    triad: "Major",
    extensions: ["7", "#9"],
    canSkipPerfectFifth: true,
  },
  {
    description: "7#11",
    intervals: [0, 4, 7, 10, 18],
    name: "7#11",
    triad: "Major",
    extensions: ["7", "#11"],
    canSkipPerfectFifth: true,
  },
  {
    description: "7b13",
    intervals: [0, 4, 7, 10, 20],
    name: "7b13",
    triad: "Major",
    extensions: ["7", "b13"],
    canSkipPerfectFifth: true,
  },
  {
    description: "7 Sharp 9 Sharp 11",
    intervals: [0, 4, 7, 10, 15, 18],
    name: "7#9#11",
    triad: "Major",
    extensions: ["7", "#9", "#11"],
    canSkipPerfectFifth: true,
  },
  {
    description: "9#11",
    intervals: [0, 4, 7, 10, 14, 18],
    name: "9#11",
    triad: "Major",
    extensions: ["7", "9", "#11"],
    canSkipPerfectFifth: true,
  },
  {
    description: "9 Flat 13",
    intervals: [0, 4, 7, 10, 14, 20],
    name: "9b13",
    triad: "Major",
    extensions: ["7", "9", "b13"],
    canSkipPerfectFifth: true,
  },
  {
    description: "13#11",
    intervals: [0, 4, 7, 10, 14, 18, 21],
    name: "13#11",
    triad: "Major",
    extensions: ["7", "9", "#11", "13"],
    canSkipPerfectFifth: true,
  },
  {
    description: "13 Flat 9",
    intervals: [0, 4, 7, 10, 13, 21],
    name: "13b9",
    triad: "Major",
    extensions: ["7", "b9", "13"],
    canSkipPerfectFifth: true,
  },
  {
    description: "13 Sharp 9",
    intervals: [0, 4, 7, 10, 15, 21],
    name: "13#9",
    triad: "Major",
    extensions: ["7", "#9", "13"],
    canSkipPerfectFifth: true,
  },
  {
    description: "MajorAdd9",
    intervals: [0, 4, 7, 14],
    name: "add9",
    triad: "Major",
    extensions: ["9"],
    canSkipPerfectFifth: false,
  },
  {
    description: "MinorAdd9",
    intervals: [0, 3, 7, 14],
    name: "madd9",
    triad: "Minor",
    extensions: ["9"],
    canSkipPerfectFifth: false,
  },
  {
    description: "MajorAdd11",
    intervals: [0, 4, 7, 17],
    name: "add11",
    triad: "Major",
    extensions: ["11"],
    canSkipPerfectFifth: false,
  },
  {
    description: "MinorAdd11",
    intervals: [0, 3, 7, 17],
    name: "madd11",
    triad: "Minor",
    extensions: ["11"],
    canSkipPerfectFifth: false,
  },
  {
    description: "5 (Power Chord)",
    intervals: [0, 7],
    name: "5",
    triad: "Power",
    extensions: [],
    canSkipPerfectFifth: false,
  },
];

export const isAdvancedMode = (mode: ChordMode) => mode.extensions.length > 0;

export const getModeText = (mode: ChordMode): string => mode.name;

const buildModeOrder = (): string[] => chordModes.map((x) => x.name);

export const chordModeOrder = buildModeOrder();

// Remove the root part of the chord (the first character and an optional '#')
export const getModeSuffix = (chord: string): string =>
  chord.substring(chord[1] === "#" ? 2 : 1);

export type ChordModeVariations = {
  chordMode: ChordMode;
  variationsByNote: (Chord[] | undefined)[];
};

export type ChordModeVariationsContainer = {
  chordModeVariations: ChordModeVariations;
  preferredVariationsByNote: (ChordPreferredVariations | undefined)[];
};

export const getChordName = (note: Note, mode: ChordMode) => {
  const text = getNoteText(note);
  return text + getModeText(mode);
};
