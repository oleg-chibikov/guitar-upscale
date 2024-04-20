import { Note, OctaveNote, parseStringToNotes, tunings } from "../data/notes";
import { Example } from "../data/scales";
import { NotePlayEventBus } from "./eventBus";
import { Neck } from "./generateNeckRepresentation";

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

  const decodeMelody = (await import("./melodyDecoder")).decodeMelody;
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
