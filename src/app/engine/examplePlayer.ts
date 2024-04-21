import { Note, OctaveNote, parseStringToNotes, tunings } from "../data/notes";
import { getScaleExamples } from "../data/scaleExamples";
import { NotePlayEventBus } from "./eventBus";
import { Neck } from "./generateNeckRepresentation";
import { decodeMelody } from "./melodyDecoder";

export type PlayExampleParameters = {
  baseNote: Note;
  scaleGroup: string;
  scale: string;
  waitNote: () => Promise<void>;
  neck: Neck;
  tuning: OctaveNote[];
  isCurrentlyPlaying: () => boolean;
  showAlert: (message: string) => void;
  setTempo: (tempoBpm: number) => void;
};

export const playExample = async ({
  baseNote,
  scaleGroup,
  scale,
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

  const examplesForScale = getScaleExamples(scaleGroup, scale);
  if (!examplesForScale) {
    return false;
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
  return true;
};
