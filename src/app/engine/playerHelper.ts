import { ChordEventBus, NotePlayEventBus } from "@/app/engine/eventBus";
import { ChordOrNote } from "@/app/engine/eventsByTick";

export const playAllNotes = (
  eventsToPlay: ChordOrNote[] | Set<ChordOrNote>,
  logPrefix: string,
  tick: number
) => {
  console.log(logPrefix + "Playing events at tick %d", tick);
  eventsToPlay.forEach(({ note, chord }) => {
    if (note) {
      NotePlayEventBus.next({
        stringOctaveNote: note.note,
        looperChannel: note.looperChannel,
        trackInstrument: note.instrument,
        trackNumber: note.trackNumber,
        skipChordDetection: true,
      });
    }
    if (chord) {
      ChordEventBus.next(chord);
    }
  });
};
