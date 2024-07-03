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

export type ChordVariations = Chord[];
export type ChordVariationsByNote = (ChordVariations | undefined)[];

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
];

export let advancedChordModes: ChordMode[] = [];

export const setAdvancedChordModes = (data: ChordMode[]) => {
  advancedChordModes = data;
};

export const isAdvancedMode = (mode: ChordMode) => mode.extensions.length > 0;

export const getModeText = (mode: ChordMode): string => mode.name;

const buildModeOrder = (): string[] => chordModes.map((x) => x.name);

export const chordModeOrder = buildModeOrder();

// Remove the root part of the chord (the first character and an optional '#')
export const getModeSuffix = (chord: string): string =>
  chord.substring(chord[1] === "#" ? 2 : 1);

export type ChordModeVariations = {
  chordMode: ChordMode;
  variationsByNote: ChordVariationsByNote;
};

export type ChordModeVariationsContainer = {
  chordModeVariations: ChordModeVariations;
  preferredVariationsByNote: (ChordPreferredVariations | undefined)[];
};

export const getChordName = (note: Note, mode: ChordMode) => {
  const text = getNoteText(note);
  return text + getModeText(mode);
};
