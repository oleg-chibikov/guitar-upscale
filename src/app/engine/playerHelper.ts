import { debugLog } from "@/app/helpers/debugLog";
import { MAX_VOLUME } from "@/app/data/volume";
import { ChordEventBus, NotePlayEventBus } from "@/app/engine/eventBus";
import { ChordOrNote } from "@/app/engine/eventsByTick";
import { tickToMilliseconds } from "@/app/helpers/clockHelper";
import { tempoBpmValue, volumeValue } from "@/app/store/settingsSlice";

export const playChordOrNote = ({ note, chord, duration }: ChordOrNote) => {
  if (note) {
    NotePlayEventBus.next({
      stringOctaveNote: note.note,
      durationMs:
        duration === undefined
          ? undefined
          : tickToMilliseconds(duration, tempoBpmValue),
      volume:
        note.velocity === undefined
          ? undefined
          : (volumeValue * note.velocity) / MAX_VOLUME,
      looperChannel: note.looperChannel,
      trackInstrument: note.instrument,
      trackNumber: note.trackNumber,
      skipChordDetection: true,
      fromPlayback: true,
    });
  }
  if (chord) {
    // the chord button passes the metadata on to each note of the chord
    chord.metadata.fromPlayback = true;
    ChordEventBus.next(chord);
  }
};

export const playAllNotes = (
  eventsToPlay: ChordOrNote[] | Set<ChordOrNote>,
  logPrefix: string,
  tick: number,
) => {
  debugLog(logPrefix + "Playing events at tick %d", tick);
  eventsToPlay.forEach(playChordOrNote);
};
