import { Chord, Note, getNoteText } from "@/app/data/notes";

export enum ChordMode {
  Major,
  Minor,
  Diminished,
  Augmented,
  Augmented7,
  Suspended4,
  Suspended2,
  Fifth, // Power chord
  Sixth,
  SixthMinorMajor,
  SixthAdd9,
  SixthMinorAdd9,
  Seventh,
  SeventhMajor,
  SeventhMinor,
  SeventhMinorMajor,
  Ninth,
  NinthMajor,
  NinthMinor,
  NinthMinorMajor,
  Eleventh,
  EleventhMajor,
  EleventhMinor,
  EleventhMinorMajor,
  Add2,
  Add9,
  MinorAdd9,
  Hendrix,
}

export const isAdvancedMode = (mode: ChordMode) =>
  mode !== ChordMode.Major && mode !== ChordMode.Minor;

export function getModeText(mode: ChordMode): string {
  switch (mode) {
    case ChordMode.Major:
      return "";
    case ChordMode.Minor:
      return "m";
    case ChordMode.Diminished:
      return "dim";
    case ChordMode.Augmented:
      return "aug";
    case ChordMode.Augmented7:
      return "aug7";
    case ChordMode.Suspended4:
      return "sus4";
    case ChordMode.Suspended2:
      return "sus2";
    case ChordMode.Fifth:
      return "5";
    case ChordMode.Sixth:
      return "6";
    case ChordMode.SixthMinorMajor:
      return "mM6";
    case ChordMode.SixthAdd9:
      return "6/9";
    case ChordMode.SixthMinorAdd9:
      return "6m/9";
    case ChordMode.Seventh:
      return "7";
    case ChordMode.SeventhMajor:
      return "M7";
    case ChordMode.SeventhMinor:
      return "m7";
    case ChordMode.SeventhMinorMajor:
      return "mM7";
    case ChordMode.Ninth:
      return "9";
    case ChordMode.NinthMajor:
      return "M9";
    case ChordMode.NinthMinor:
      return "m9";
    case ChordMode.NinthMinorMajor:
      return "mM9";
    case ChordMode.Eleventh:
      return "11";
    case ChordMode.EleventhMajor:
      return "M11";
    case ChordMode.EleventhMinor:
      return "m11";
    case ChordMode.EleventhMinorMajor:
      return "mM11";
    case ChordMode.Add2:
      return "/2";
    case ChordMode.Add9:
      return "/9";
    case ChordMode.MinorAdd9:
      return "m/9";
    case ChordMode.Hendrix:
      return "7#9";
  }
}

function buildModeOrder(): string[] {
  return Object.values(ChordMode)
    .filter((value) => typeof value === "number")
    .map((value) => getModeText(value as ChordMode));
}

export const chordModeOrder = buildModeOrder();

export function getModeSuffix(chord: string): string {
  // Remove the root part of the chord (the first character and an optional '#')
  let rootEndIndex = 1;
  if (chord[1] === "#") {
    rootEndIndex = 2;
  }

  // Extract the suffix
  return chord.substring(rootEndIndex);
}

export const chordModes = new Map<ChordMode, number[][]>([
  [
    ChordMode.Major,
    [
      [0, 7, 0, 4, 7, 0],
      [0, 4, 7, 0, 4, 0], // the first option doesn't cover standard C chord but this does
    ],
  ],
  [ChordMode.Minor, [[0, 7, 0, 3, 7, 0]]],
  [ChordMode.Diminished, [[0, 6, 0, 3, 7, 0]]],
  [ChordMode.Augmented, [[0, 8, 0, 4, 7, 0]]],
  [
    ChordMode.Augmented7,
    [
      [0, 8, 10, 4, 7, 0],
      [0, 8, 10, 4, 10, 0],
      [0, 8, 0, 4, 10, 0],
    ],
  ],
  [ChordMode.Suspended4, [[0, 5, 0, 5, 7, 0]]],
  [
    ChordMode.Suspended2,
    [
      [0, 7, 0, 2, 7, 0],
      [0, 7, 4, 2, 7, 0],
    ],
  ],
  [ChordMode.Fifth, [[0, 7, 0, 7, 7, 0]]],
  [
    ChordMode.Sixth,
    [
      [0, 7, 0, 4, 9, 0],
      [0, 7, 0, 7, 9, 3],
    ],
  ],
  [
    ChordMode.SixthMinorMajor,
    [
      [0, 7, 0, 3, 9, 0],
      [0, 7, 0, 3, 9, 3],
      [0, 9, 0, 3, 7, 0],
    ],
  ],
  [ChordMode.SixthAdd9, [[0, 7, 2, 7, 9, 4]]],
  [ChordMode.SixthMinorAdd9, [[0, 7, 2, 7, 9, 3]]],
  [
    ChordMode.Seventh,
    [
      [0, 7, 10, 4, 7, 0],
      [0, 7, 0, 4, 10, 0],
    ],
  ],
  [
    ChordMode.SeventhMajor,
    [
      [0, 7, 11, 4, 7, 0],
      [0, 7, 0, 7, 11, 4],
      [0, 8, 0, 3, 7, 0],
    ],
  ],
  [ChordMode.SeventhMinor, [[0, 7, 10, 3, 7, 0]]],
  [ChordMode.SeventhMinorMajor, [[0, 7, 11, 3, 7, 0]]],
  [
    ChordMode.Ninth,
    [
      [0, 7, 10, 4, 7, 2],
      [0, 7, 2, 7, 10, 4],
    ],
  ],
  [ChordMode.NinthMajor, [[0, 7, 11, 4, 7, 2]]],
  [
    ChordMode.NinthMinor,
    [
      [0, 7, 10, 3, 7, 2],
      [0, 7, 10, 3, 10, 2],
      [0, 7, 0, 3, 10, 2],
    ],
  ],
  [ChordMode.NinthMinorMajor, [[0, 7, 11, 3, 7, 2]]],
  [
    ChordMode.Eleventh,
    [
      [0, 5, 10, 4, 7, 2],
      [0, 5, 2, 7, 10, 4],
    ],
  ],
  [ChordMode.EleventhMajor, [[0, 5, 11, 4, 7, 2]]],
  [
    ChordMode.EleventhMinor,
    [
      [0, 5, 10, 3, 7, 2],
      [0, 7, 2, 5, 10, 3],
    ],
  ],
  [ChordMode.EleventhMinorMajor, [[0, 5, 11, 3, 7, 2]]],
  [ChordMode.Add2, [[0, 7, 2, 4, 7, 0]]],
  [
    ChordMode.Add9,
    [
      [0, 7, 0, 4, 7, 2],
      [0, 7, 2, 7, 7, 4],
    ],
  ],
  [
    ChordMode.MinorAdd9,
    [
      [0, 7, 0, 3, 7, 2],
      [0, 7, 2, 7, 7, 3],
    ],
  ],
  [
    ChordMode.Hendrix,
    [
      [0, 0, 4, 10, 3, 0],
      [0, 7, 10, 4, 10, 3],
    ],
  ], // [0, 7, 0, 4, 7, 0],
]);

export const chordModesArray = Array.from(chordModes);

export type NoteChordMode = {
  mode: ChordMode;
  variations: Chord[];
};

export type NoteChords = {
  note: Note;
  modes: NoteChordMode[];
};

export const getChordName = (note: Note, mode: ChordMode) => {
  const text = getNoteText(note);
  return text + getModeText(mode);
};
