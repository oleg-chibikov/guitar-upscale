import {
  Chord,
  Note,
  OctaveNote,
  parseStringToNotes,
  serializeOctaveNote,
  tunings,
} from "../data/notes";
import { Example } from "../data/scales";
import { NotePlayEventBus } from "./eventBus";
import { Neck } from "./generateNeckRepresentation";
import { decodeMelody } from "./melodyDecoder";

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

export const playExample = async (
  baseNote: Note,
  examplesForScale: Example[],
  waitNote: () => Promise<void>,
  neck: Neck,
  tuning: OctaveNote[],
  isPlayingRef: React.MutableRefObject<boolean>,
  showAlert: (message: string) => void,
  setTempo: (tempoBpm: number) => void
) => {
  function getRandomRecord<T>(array: T[]): T {
    const randomIndex = Math.floor(Math.random() * array.length);
    return array[randomIndex];
  }

  const randomExample = getRandomRecord(examplesForScale);
  showAlert(randomExample.band + " - " + randomExample.title);

  if (randomExample.tempo) {
    setTempo(randomExample.tempo);
  }

  await decodeMelody(
    randomExample.melody,
    (note) => {
      console.log(
        "Requesting auto play note in a melody: " + JSON.stringify(note)
      );
      NotePlayEventBus.next({ note, metadata: { fromChord: false } });
    },
    waitNote,
    neck,
    parseStringToNotes(randomExample.tuning ?? tunings[0]),
    tuning,
    baseNote,
    isPlayingRef
  );
  return;
};
