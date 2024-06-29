// https://how-to-play-electric-guitar.net/guitar-strumming-patterns.html

// Note: Updating this requires dropping the persisted store, otherwise it will use previous values
import {
  DEFAULT_TIME_SIGNATURE,
  Pattern,
  TimeSignature,
} from "@/app/data/strummingData";

let i = 0;
export const chordStrummingPatterns: Pattern[] = [
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
