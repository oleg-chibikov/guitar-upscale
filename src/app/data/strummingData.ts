import {
  TICKS_IN_BAR,
  TICKS_IN_BEAT,
  TICKS_IN_HALF_BAR,
  TICKS_IN_HALF_BEAT,
} from "@/app/engine/clock/clockConstants";

export const STRUMMING_PLACEHOLDER = "_";
export type StrumDirection = "" | "↑" | "↓";
export type TimeSignature =
  | "1/1"
  | "1/2"
  | "1/4"
  | "1/8"
  | "1/16"
  | "1/32"
  | "1/64";
// | "1/4 triplet"
// | "1/8 triplet"
// | "1/16 triplet";

export const timeSignatureOptions = [
  { value: "1/1", label: "1 bar" },
  { value: "1/2", label: "1/2 bar" },
  { value: "1/4", label: "1 beat" },
  { value: "1/8", label: "1/2 beat" },
  { value: "1/16", label: "1/4 beat" },
  { value: "1/32", label: "1/8 beat" },
  { value: "1/64", label: "1/16 beat" },
  // { value: "1/4 triplet", label: "1/4 triplet" },
  // { value: "1/8 triplet", label: "1/8 triplet" },
  // { value: "1/16 triplet", label: "1/16 triplet" },
];

export const getTicksForTimeSignature = (
  timeSignature: TimeSignature
): number => {
  switch (timeSignature) {
    case "1/1":
      return TICKS_IN_BAR;
    case "1/2":
      return TICKS_IN_HALF_BAR;
    case "1/4":
      return TICKS_IN_BEAT;
    case "1/8":
      return TICKS_IN_HALF_BEAT;
    case "1/16":
      return TICKS_IN_HALF_BEAT / 2;
    case "1/32":
      return TICKS_IN_HALF_BEAT / 4;
    case "1/64":
      return TICKS_IN_HALF_BEAT / 8;
    // case "1/4 triplet":
    //   return 16;
    // case "1/8 triplet":
    //   return 8;
    // case "1/16 triplet":
    //   return 4;
    default:
      return TICKS_IN_HALF_BEAT / 8;
  }
};

export interface Pattern {
  id: string;
  timeSignature: TimeSignature;
  strums: StrumDirection[];
}
