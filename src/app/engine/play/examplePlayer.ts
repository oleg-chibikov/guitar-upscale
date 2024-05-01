import { PlayExampleParameters } from "../../data/playExampleParameters";
import { parseStringToNotes } from "../../data/tunings";
import { ChordEventBus, NotePlayEventBus } from "../eventBus";
import { setCurrentChord } from "../strummingState";
import { decodeMelody } from "./melodyDecoder";

export const playExample = async ({
  baseNote,
  example,
  waitNote,
  neck,
  tuning,
  showAlert,
}: PlayExampleParameters) => {
  showAlert(example.band + " - " + example.title);

  const trackPromises = example.tracks.map((track, trackNumber) =>
    decodeMelody(
      track,
      (note) => {
        console.log(
          "Requesting auto play note in a melody: " + JSON.stringify(note)
        );
        NotePlayEventBus.next({
          fromChord: false,
          trackNumber,
          trackInstrument: track.instrument,
          stringOctaveNote: note,
          skipChordDetection: true,
        });
      },
      (chordToPlay) => {
        setCurrentChord(chordToPlay);
        ChordEventBus.next({
          chord: chordToPlay,
          metadata: {
            trackNumber,
            notesToPlay: 4,
            strummingDelayMs: 10,
            trackInstrument: track.instrument,
          }, // override default settings
        });
      },
      waitNote,
      neck,
      parseStringToNotes(example.tuning ?? "EBGDAE"),
      tuning,
      baseNote
    )
  );
  await Promise.all(trackPromises);
};
