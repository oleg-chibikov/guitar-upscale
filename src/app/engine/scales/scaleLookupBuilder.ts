import { NOTE_COUNT, Note, getNoteText } from "@/app/data/notes";
import { Scale, scalesMap } from "@/app/data/scales";
import { getUnshiftedNote } from "@/app/data/tunings";
import {
  capoValue,
  scaleGroupValue,
  scaleValue,
  setCapo,
  setScale,
  setScaleGroup,
  tuningValue,
} from "@/app/store/settingsSlice";
import { Dispatch, UnknownAction } from "redux";

export type ScaleAndGroup = { scale: string; group: string; note: Note };

export const formatScale = (scaleAndGroup: ScaleAndGroup) =>
  `${scaleAndGroup.group}: ${getNoteText(scaleAndGroup.note)} ${
    scaleAndGroup.scale
  }`;

export const setCurrentScaleAndGroup = (
  data: ScaleAndGroup,
  dispatch: Dispatch<UnknownAction>,
) => {
  let changed = false;
  if (data.group !== scaleGroupValue) {
    changed = true;
    dispatch(setScaleGroup(data.group));
  }
  if (data.scale !== scaleValue) {
    changed = true;
    dispatch(setScale(data.scale));
  }
  const unshiftedNote = getUnshiftedNote(data.note, tuningValue);
  console.log("New base note", getNoteText(unshiftedNote));
  if (capoValue !== unshiftedNote) {
    changed = true;
    dispatch(setCapo(unshiftedNote));
  }
  return changed;
};

export const rebuildScaleDetectorLookup = () => {
  if (!addScaleToDetectorLookup) {
    throw new Error("addScaleToDetectorLookup is not set");
  }
  const allScales = scalesMap.entries();
  // for each of notes we go through all the scales and add them to the lookup

  // Create a Map to store encountered scales and their names
  const encounteredScales = new Map<string, string>();

  // Iterate through each group
  for (const [group, groupMap] of Array.from(allScales)) {
    // Iterate through each scale within the group
    for (const [scaleName, scaleNotesWithoutZero] of Array.from(
      groupMap.entries(),
    )) {
      const fullScaleNotes = [0].concat(scaleNotesWithoutZero);
      const scaleString = JSON.stringify(fullScaleNotes);

      // A scale listed twice, such as harmonic minor, is detected under its first name only
      if (encounteredScales.has(scaleString)) {
        continue;
      }
      encounteredScales.set(scaleString, scaleName);
      if (group === "Special") {
        // don't use special scales for detection
        continue;
      }
      for (let note = 0; note < NOTE_COUNT; note++) {
        const shiftedScale = fullScaleNotes
          .map((x) => (x + note) % NOTE_COUNT)
          .sort((a, b) => a - b);
        addScaleToDetectorLookup(shiftedScale, {
          group,
          note,
          scale: scaleName,
        });
      }
    }
  }
};

export const setScaleDetectorFunctions = (
  clear: () => void,
  addScale: (scale: Scale, scaleData: ScaleAndGroup) => void,
) => {
  clearScaleDetector = clear;
  addScaleToDetectorLookup = addScale;
  rebuildScaleDetectorLookup(); // we need to re-scan all the scales after setting the function
};

export let clearScaleDetector: () => void | undefined;

export let addScaleToDetectorLookup:
  ((scale: Scale, scaleData: ScaleAndGroup) => void) | undefined;
