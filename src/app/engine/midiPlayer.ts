import { NoteEvent } from "@/app/data/looperData";
import { NotePlayEventBus } from "@/app/engine/eventBus";
import { waitForNextBar, waitForTick } from "./mainClock";

const LOG_PREFIX = "MidiPlayer: ";

export type MidiPlayerOptions = {
  eventsByTick: Map<number, NoteEvent[]>;
};

export class MidiPlayer {
  private eventsByTick: Map<number, NoteEvent[]>;
  private abortController = new AbortController();

  constructor(eventsByTick: Map<number, NoteEvent[]>) {
    this.eventsByTick = eventsByTick;
  }

  stopPlaying(): void {
    this.abortController.abort();
    this.abortController = new AbortController();
  }

  async play(): Promise<void> {
    const sortedTicks = Array.from(this.eventsByTick.keys()).sort(
      (a, b) => a - b
    );

    // Edge case: if there are no notes, just return
    if (sortedTicks.length === 0) {
      return;
    }

    console.log(LOG_PREFIX + "Midi info", this.eventsByTick);

    const abortSignal = this.abortController.signal;

    await waitForNextBar();

    let currentTick = 1;

    for (const tick of sortedTicks) {
      if (abortSignal.aborted) {
        return;
      }

      await waitForTick(tick, currentTick, abortSignal, LOG_PREFIX);
      currentTick = tick;

      if (abortSignal.aborted) {
        return;
      }

      this.playEventsAtTick(currentTick);
    }
    console.log(LOG_PREFIX + "All events are played");
  }

  private playEventsAtTick(tick: number) {
    const eventsAtTick = this.eventsByTick.get(tick);

    if (!eventsAtTick || !eventsAtTick.length) {
      return;
    }

    console.log(LOG_PREFIX + "Playing events at tick %d", tick);
    eventsAtTick.forEach((note) => {
      NotePlayEventBus.next({
        stringOctaveNote: note.note,
        trackInstrument: note.instrument,
        trackNumber: note.trackNumber,
        skipChordDetection: true,
      });
    });
  }
}
