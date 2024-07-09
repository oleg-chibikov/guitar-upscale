import { waitForNextTick } from "@/app/engine/clock/mainClock";
import { ChordEventBus, NotePlayEventBus } from "@/app/engine/eventBus";
import { ChordOrNote } from "@/app/engine/eventsByTick";

export const playChordOrNote = ({ note, chord }: ChordOrNote) => {
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
};

export const playAllNotes = (
  eventsToPlay: ChordOrNote[] | Set<ChordOrNote>,
  logPrefix: string,
  tick: number
) => {
  console.log(logPrefix + "Playing events at tick %d", tick);
  eventsToPlay.forEach(playChordOrNote);
};

export const waitForTick = async (
  tickToWaitFor: number,
  currentTick: number,
  checkFinished: () => boolean,
  logPrefix: string
) => {
  const ticksToWait = tickToWaitFor - currentTick;
  console.log(logPrefix + "Waiting for %d ticks", ticksToWait);
  for (let i = 0; i < ticksToWait; i++) {
    if (checkFinished()) {
      return Promise.resolve();
    }
    await waitForNextTick();
  }
};
