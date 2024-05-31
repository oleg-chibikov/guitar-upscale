import { ChordOrNote } from "@/app/data/looperData";
import { ChordEventBus, NotePlayEventBus } from "@/app/engine/eventBus";

export const playAllNotes = (
  eventsToPlay: ChordOrNote[] | Set<ChordOrNote>
) => {
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
