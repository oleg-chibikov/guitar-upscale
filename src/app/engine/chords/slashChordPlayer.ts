import { StringOctaveNoteWithFingerPosition } from "@/app/data/chordModes";
import { getSlashChordVoicing } from "@/app/engine/chords/slashChordVoicing";
import {
  capoValue,
  neckValue,
  slashChordBassNoteValue,
} from "@/app/store/settingsSlice";

export const replaceBassNoteWithSlash = (
  variation: StringOctaveNoteWithFingerPosition[]
) => {
  if (slashChordBassNoteValue === undefined || !neckValue) {
    return;
  }
  const voicing = getSlashChordVoicing(
    variation,
    slashChordBassNoteValue,
    neckValue,
    capoValue
  );
  if (!voicing) {
    return;
  }
  variation.splice(0, variation.length, ...voicing);
};
