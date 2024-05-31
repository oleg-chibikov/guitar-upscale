import { ChordOrNote } from "@/app/data/looperData";
import { playAllNotes } from "@/app/engine/playerHelper";
import { isPlayingValue } from "@/app/store/settingsSlice";
import { waitForTick } from "./mainClock";

const LOG_PREFIX = "MidiPlayer: ";

export type MidiPlayerOptions = {
  eventsByTick: Map<number, ChordOrNote[]>;
};

export class MidiPlayer {
  private eventsByTick: Map<number, ChordOrNote[]>;
  private abortController = new AbortController();

  constructor(eventsByTick: Map<number, ChordOrNote[]>) {
    this.eventsByTick = eventsByTick;
  }

  stopPlaying(): void {
    this.abortController.abort();
    this.abortController = new AbortController();
  }

  async play(): Promise<void> {
    console.log("Playing midi file");

    // Edge case: if there are no notes, just return
    if (this.eventsByTick.size === 0) {
      console.log("No events in midi file");
      return;
    }

    console.log(LOG_PREFIX + "Midi info", this.eventsByTick);

    const abortSignal = this.abortController.signal;

    // await waitForNextBar();

    let currentTick = 1;
    // const sortedTicks = Array.from(this.eventsByTick.keys()).sort(
    //   (a, b) => a - b
    // );
    for (const tick of Array.from(this.eventsByTick.keys())) {
      if (abortSignal.aborted || !isPlayingValue) {
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
    playAllNotes(eventsAtTick);
  }
}
