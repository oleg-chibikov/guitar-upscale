import { EventsByTick } from "@/app/engine/eventsByTick";
import { playAllNotes } from "@/app/engine/playerHelper";
import {
  isPlayingValue,
  waitForPauseToBeReleased,
} from "@/app/store/settingsSlice";
import { waitForTick } from "./mainClock";

const LOG_PREFIX = "MidiPlayer: ";

export type MidiPlayerOptions = {
  eventsByTick: EventsByTick;
};

export class MidiPlayer {
  private eventsByTick: EventsByTick;
  private abortController = new AbortController();

  constructor(eventsByTick: EventsByTick) {
    this.eventsByTick = eventsByTick;
  }

  stopPlaying(): void {
    this.abortController.abort();
    this.abortController = new AbortController();
  }

  async play(): Promise<void> {
    console.log("Playing midi file");

    // Edge case: if there are no notes, just return
    if (!this.eventsByTick.hasItems) {
      console.log("No events in midi file");
      return;
    }

    console.log(LOG_PREFIX + "Midi info", this.eventsByTick);

    const abortSignal = this.abortController.signal;

    // await waitForNextBar();

    let currentTick = 1;
    await this.eventsByTick.forEachEvent(async (tick, events) => {
      if (abortSignal.aborted || !isPlayingValue) {
        return;
      }

      // these 2 promises should be waited for sequentially - we should check if it's paused after the clock interval has been released, otherwise the extra note might get played
      await waitForTick(tick, currentTick, abortSignal, LOG_PREFIX);
      await waitForPauseToBeReleased();
      currentTick = tick;

      if (abortSignal.aborted) {
        return;
      }

      console.log(LOG_PREFIX + "Playing events at tick %d", tick);
      playAllNotes(events);
    });
    console.log(LOG_PREFIX + "All events are played");
  }
}
