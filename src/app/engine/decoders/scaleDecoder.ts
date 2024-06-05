import { Chord, OctaveNote, serializeOctaveNote } from "@/app/data/notes";
import { EventsByTick } from "@/app/engine/eventsByTick";
import { TICKS_IN_HALF_BEAT } from "@/app/engine/mainClock";
import { isPlayingValue, neckValue } from "@/app/store/settingsSlice";

export const getWholeScale = (playFullString: boolean): EventsByTick => {
  if (!neckValue) {
    throw new Error("Neck is not set up");
  }
  const neckCopy = [...neckValue];
  const reverse = Math.random() < 0.5;
  if (reverse) {
    neckCopy.reverse();
  }

  let tickIndex = 0;
  const result = new EventsByTick();
  // used to be stored in StringOctaveNotes
  let realStringIndex = reverse ? neckCopy.length - 1 : 0;
  let orderedStringIndex = 0;
  for (const string of neckCopy) {
    // Check if playback should be stopped
    if (!isPlayingValue) {
      break;
    }
    const stringCopy = [...string].filter((x) => x) as Chord;

    realStringIndex = reverse ? realStringIndex - 1 : realStringIndex + 1; //incrementing string index here
    orderedStringIndex++;

    if (!reverse) {
      stringCopy.reverse();
    }

    let boundaryNote: string | undefined = undefined;

    if (!playFullString) {
      const nextString =
        orderedStringIndex < neckCopy.length
          ? neckCopy[orderedStringIndex]
          : undefined;

      if (nextString !== undefined) {
        const trimmedString = nextString.filter((x) => x) as OctaveNote[];
        const firstOrLastIndex = !reverse ? trimmedString.length - 1 : 0;
        const firstOrLastNoteOfNextString = trimmedString[firstOrLastIndex];
        boundaryNote = serializeOctaveNote(firstOrLastNoteOfNextString);
      }
    }

    for (const note of stringCopy) {
      // Check if playback should be stopped
      if (!isPlayingValue) {
        break;
      }

      if (boundaryNote !== undefined) {
        const serializedNote = serializeOctaveNote(note);

        if (serializedNote === boundaryNote) {
          // going to the next string when the note repeats
          break;
        }
      }

      result.addOrUpdateEvent(tickIndex * TICKS_IN_HALF_BEAT, {
        trackNumber: 0,
        note,
      });
      tickIndex++;
    }
  }
  return result;
};
