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

const lastStrummingPatternId = i;

const isIdSmallerThanLastStrummingPatternId = (id: number): boolean =>
  id < lastStrummingPatternId;

console.log(chordStrummingPatterns);
console.log("Last pattern ID:", lastStrummingPatternId);

export function getPatternById(id: number): Pattern | undefined {
  // First, check predefined patterns
  if (isIdSmallerThanLastStrummingPatternId(id)) {
    const predefinedPattern = chordStrummingPatterns.find(
      (pattern) => pattern.id === id
    );
    if (predefinedPattern) {
      return predefinedPattern;
    }
  }

  // If not found in predefined patterns, check custom patterns in local storage

  // TODO: Optimize: store this as an in-memory structure and it should be a map!
  const savedPatternsString = localStorage.getItem("strummingPatterns");
  if (savedPatternsString) {
    const savedPatterns: Pattern[] = JSON.parse(savedPatternsString);
    return savedPatterns.find((pattern) => pattern.id === id);
  }

  // If pattern is not found, return undefined
  return undefined;
}
