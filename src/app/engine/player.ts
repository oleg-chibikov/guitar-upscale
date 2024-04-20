import { Chord, OctaveNote, serializeOctaveNote } from "../data/notes";
import { NotePlayEventBus } from "./eventBus";
import { Neck } from "./generateNeckRepresentation";

export const playWholeScale = async (
  wait: () => Promise<void>,
  neck: Neck,
  isPlayingRef: React.MutableRefObject<boolean>,
  playFullString: boolean
) => {
  const reverse = Math.random() < 0.5;
  var neckCopy = [...neck];
  if (reverse) {
    neckCopy.reverse();
  }

  // used to be stored in StringOctaveNotes
  let realStringIndex = reverse ? neckCopy.length - 1 : 0;
  let orderedStringIndex = 0;
  for (const string of neckCopy) {
    // Check if playback should be stopped
    if (!isPlayingRef.current) {
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
      if (!isPlayingRef.current) {
        break;
      }

      if (boundaryNote) {
        const serializedNote = serializeOctaveNote(note);

        if (serializedNote === boundaryNote) {
          // going to the next string when the note repeats
          break;
        }
      }

      console.log("Requesting auto play note: " + JSON.stringify(note));
      NotePlayEventBus.next({ note, metadata: { fromChord: false } });
      await wait();
    }
  }
};
