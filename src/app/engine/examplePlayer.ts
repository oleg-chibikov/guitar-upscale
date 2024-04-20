import { Note, OctaveNote, parseStringToNotes, tunings } from "../data/notes";
import { Example } from "../data/scales";
import { NotePlayEventBus } from "./eventBus";
import { Neck } from "./generateNeckRepresentation";
import { decodeMelody } from "./melodyDecoder";

export type PlayExampleParameters = {
  baseNote: Note;
  examplesForScale: Example[];
  waitNote: () => Promise<void>;
  neck: Neck;
  tuning: OctaveNote[];
  isCurrentlyPlaying: () => boolean;
  showAlert: (message: string) => void;
  setTempo: (tempoBpm: number) => void;
};

export const playExample = async ({
  baseNote,
  examplesForScale,
  waitNote,
  neck,
  tuning,
  isCurrentlyPlaying,
  showAlert,
  setTempo,
}: PlayExampleParameters) => {
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
    isCurrentlyPlaying
  );
  return;
};
