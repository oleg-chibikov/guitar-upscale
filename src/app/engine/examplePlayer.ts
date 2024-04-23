import { Example } from "../data/example";
import { Note, OctaveNote } from "../data/notes";
import { parseStringToNotes } from "../data/tunings";
import { ChordEventBus, NotePlayEventBus, PlayParams } from "./eventBus";
import { Neck } from "./generateNeckRepresentation";
import { decodeMelody } from "./melodyDecoder";

export type PlayExampleParameters = {
  baseNote: Note;
  examples: Example[];
  waitNote: () => Promise<void>;
  neck: Neck;
  tuning: OctaveNote[];
  playParams: PlayParams;
  isCurrentlyPlaying: () => boolean;
  showAlert: (message: string) => void;
  setTempo: (tempoBpm: number) => void;
};

export const playExample = async ({
  baseNote,
  examples,
  waitNote,
  neck,
  tuning,
  playParams,
  isCurrentlyPlaying,
  showAlert,
  setTempo,
}: PlayExampleParameters) => {
  function getRandomRecord<T>(array: T[]): T {
    const randomIndex = Math.floor(Math.random() * array.length);
    return array[randomIndex];
  }

  const randomExample = getRandomRecord(examples);
  showAlert(randomExample.band + " - " + randomExample.title);

  if (randomExample.tempo) {
    setTempo(randomExample.tempo);
  }

  const trackPromises = randomExample.tracks.map((track, trackNumber) =>
    decodeMelody(
      track,
      (note) => {
        console.log(
          "Requesting auto play note in a melody: " + JSON.stringify(note)
        );
        NotePlayEventBus.next({
          ...playParams,
          fromChord: false,
          trackNumber,
          instrument: track.instrument ?? playParams.instrument,
          stringOctaveNote: note,
        });
      },
      (chordToPlay) => {
        ChordEventBus.next({
          chord: chordToPlay,
          metadata: {
            trackNumber,
            notesToPlay: 4,
            strummingDelayMs: 10,
            instrument: track.instrument,
          }, // override default settings
        });
      },
      waitNote,
      neck,
      parseStringToNotes(randomExample.tuning ?? "EBGDAE"),
      tuning,
      baseNote,
      isCurrentlyPlaying
    )
  );
  await Promise.all(trackPromises);
};
