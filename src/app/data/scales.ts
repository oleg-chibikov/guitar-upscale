import { Note, NOTE_COUNT } from "@/app/data/notes";
import { getShiftedNote } from "@/app/data/tunings";
import { capoValue, tuningValue } from "@/app/store/settingsSlice";
import { scalesMap } from "@/app/data/scaleDefinitions";

export { CHROMATIC, SPECIAL, scalesMap } from "@/app/data/scaleDefinitions";
export type { Scale } from "@/app/data/scaleDefinitions";

export const getScalePattern = (
  scaleGroup: string,
  scale: string,
  useShiftedNotes: boolean = false
) => {
  let scaleNotes = scalesMap.get(scaleGroup)?.get(scale)?.concat([0]);
  if (useShiftedNotes) {
    scaleNotes = scaleNotes?.map(getShiftedNoteWithCapo);
  }
  return new Set(scaleNotes);
};

export const getShiftedNoteWithCapo = (note: Note) => {
  return (getShiftedNote(note, tuningValue) + capoValue) % NOTE_COUNT;
};
