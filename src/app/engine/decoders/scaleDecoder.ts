import { TICKS_IN_HALF_BEAT } from "@/app/data/clockConstants";
import {
  OctaveNote,
  StringOctaveNote,
  serializeOctaveNote,
} from "@/app/data/notes";
import { EventsByTick } from "@/app/engine/eventsByTick";
import {
  capoValue,
  neckValue,
  stringCountValue,
} from "@/app/store/settingsSlice";

export const getWholeScale = (playFullString: boolean): EventsByTick => {
  const stringCount = stringCountValue;
  const neck = neckValue;
  if (!neck) {
    throw new Error("Neck is not set up");
  }

  const neckCopy: StringOctaveNote[][] = [];
  const reverse = Math.random() < 0.5;
  const capo = capoValue;
  neck.forEach((neckString, index) => {
    const stringCopy = [...neckString].filter(
      (x) => x && x.fret >= capo
    ) as StringOctaveNote[];
    neckCopy[reverse ? stringCount - 1 - index : index] = stringCopy;
  });

  let tickIndex = 0;
  const result = new EventsByTick();
  // used to be stored in StringOctaveNotes
  let realStringIndex = reverse ? stringCount - 1 : 0;
  let orderedStringIndex = 0;
  for (const neckString of neckCopy) {
    realStringIndex = reverse ? realStringIndex - 1 : realStringIndex + 1; //incrementing string index here
    orderedStringIndex++;

    if (!reverse) {
      neckString.reverse();
    }

    let boundaryNote: string | undefined = undefined;

    if (!playFullString) {
      const nextString =
        orderedStringIndex < stringCount
          ? neckCopy[orderedStringIndex]
          : undefined;

      if (nextString !== undefined) {
        const trimmedString = nextString.filter((x) => x) as OctaveNote[];
        const firstOrLastIndex = !reverse ? trimmedString.length - 1 : 0;
        const firstOrLastNoteOfNextString = trimmedString[firstOrLastIndex];
        boundaryNote = serializeOctaveNote(firstOrLastNoteOfNextString);
      }
    }

    for (const note of neckString) {
      if (boundaryNote !== undefined) {
        const serializedNote = serializeOctaveNote(note);

        if (serializedNote === boundaryNote) {
          // going to the next string when the note repeats
          break;
        }
      }

      result.addEventAtTick(tickIndex * TICKS_IN_HALF_BEAT, {
        trackNumber: 0,
        note,
      });
      tickIndex++;
    }
  }
  return result;
};
