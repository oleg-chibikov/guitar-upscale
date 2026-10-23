// https://how-to-play-electric-guitar.net/guitar-strumming-patterns.html

import { TimeSignature } from "@/app/data/clockConstants";

// Note: Updating this requires dropping the persisted store, otherwise it will use previous values

export const DEFAULT_TIME_SIGNATURE = TimeSignature.HALF_BEAT;

let i = 0;
export const chordStrummingPatterns: StrummingPattern[] = [
  { id: ++i, timeSignature: DEFAULT_TIME_SIGNATURE, strums: ["↑"] },
  { id: ++i, timeSignature: DEFAULT_TIME_SIGNATURE, strums: ["↑", "↓"] },
  {
    id: ++i,
    timeSignature: TimeSignature.SIXTEENTH,
    strums: ["", "↑", "↑", "↑"],
  },
  {
    id: ++i,
    timeSignature: TimeSignature.SIXTEENTH,
    strums: ["↑", "↑", "↑", ""],
  },
  {
    id: ++i,
    timeSignature: DEFAULT_TIME_SIGNATURE,
    strums: ["↑", "↓", "", "↑", "↓", "↑", "", ""],
  },
  {
    id: ++i,
    timeSignature: DEFAULT_TIME_SIGNATURE,
    strums: ["↑", "", "", "↓", "↑", "", "", "↓"],
  },
  {
    id: ++i,
    timeSignature: DEFAULT_TIME_SIGNATURE,
    strums: ["↑", "", "↑", "↓", "", "↓", "↑", "↓"],
  },
  {
    id: ++i,
    timeSignature: DEFAULT_TIME_SIGNATURE,
    strums: ["↑", "", "↑", "↓", "", "↓", "", "↓"],
  },
  {
    id: ++i,
    timeSignature: DEFAULT_TIME_SIGNATURE,
    strums: ["↑", "↓", "↑", "↓", "", "↓", "↑", "↓"],
  },
  {
    id: ++i,
    timeSignature: DEFAULT_TIME_SIGNATURE,
    strums: ["↑", "↓", "↑", "↓", "", "↓", "", "↓"],
  },
  {
    id: ++i,
    timeSignature: DEFAULT_TIME_SIGNATURE,
    strums: ["↑", "", "", "↓", "", "", "↑", ""],
  },
  {
    id: ++i,
    timeSignature: DEFAULT_TIME_SIGNATURE,
    strums: [
      "↑",
      "",
      "↑",
      "↓",
      "",
      "↑",
      "↓",
      "",
      "↑",
      "",
      "↑",
      "↓",
      "↑",
      "",
      "↑",
      "↓",
    ],
  },
  {
    id: ++i,
    timeSignature: DEFAULT_TIME_SIGNATURE,
    strums: [
      "↑",
      "",
      "↑",
      "↓",
      "↑",
      "↓",
      "",
      "↑",
      "",
      "↑",
      "",
      "↓",
      "↑",
      "↓",
      "",
      "↓",
    ],
  },
  {
    id: ++i,
    timeSignature: DEFAULT_TIME_SIGNATURE,
    strums: [
      "↑",
      "",
      "↓",
      "",
      "↑",
      "",
      "",
      "↓",
      "",
      "↓",
      "",
      "↑",
      "",
      "↑",
      "↓",
      "↑",
    ],
  },
];

export const lastStrummingPatternId = i;

export const STRUMMING_PLACEHOLDER = "_";
export type StrumDirection = "" | "↑" | "↓";

// this function gets the number of slots for the patternEditorUI
export const getDefaultSlotsForTimeSignature = (
  timeSignature: TimeSignature,
): number => {
  switch (timeSignature) {
    case TimeSignature.ONE_BAR:
      return 4;
    case TimeSignature.HALF_BAR:
      return 8;
    case TimeSignature.ONE_BEAT:
      return 8;
    case TimeSignature.HALF_BEAT:
      return 8;
    case TimeSignature.SIXTEENTH:
      return 16;
    case TimeSignature.THIRTY_SECOND:
      return 32;
    case TimeSignature.SIXTY_FOURTH:
      return 64;
    // case "1/4 triplet":
    //   return 16;
    // case "1/8 triplet":
    //   return 8;
    // case "1/16 triplet":
    //   return 4;
    default:
      throw new Error("Invalid time signature: " + timeSignature);
  }
};

export interface StrummingPattern {
  id: number;
  timeSignature: TimeSignature;
  strums: StrumDirection[];
}

export const formatStrums = (strums: StrumDirection[]): string =>
  strums
    .map((strum, index) => {
      const separator =
        index < strums.length - 1 && (index + 1) % 4 === 0 ? " " : "";

      return (strum || "_") + separator;
    })
    .join("");
