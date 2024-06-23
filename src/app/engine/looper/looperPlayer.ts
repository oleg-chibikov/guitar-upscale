import { TICKS_IN_BAR } from "@/app/engine/clock/clockConstants";
import { EventsByTick } from "@/app/engine/eventsByTick";
import { playAllNotes, waitForTick } from "@/app/engine/playerHelper";
import {
  getCurrentRelativeTick,
  waitForNextBar,
  waitForNextTick,
} from "../clock/mainClock";

const LOG_PREFIX = "LooperPlayer: ";

export type LooperPlayerOptions = {
  eventsByTick: EventsByTick;
  lastBarTickWhenStoppedRecording: number;
  lastBarTickForLastRecordedEvent: number;
  endTick: number;
  recordingEndedInFurtherBar: boolean;
  recordingStoppedInTheFirstHalfOfLastBar: boolean;
};

export class LooperPlayer {
  private options: LooperPlayerOptions;
  private abortController = new AbortController();

  // for testing - allows to wait for the current loop to finish
  currentLoopPromise: Promise<void> | undefined;

  constructor(options: LooperPlayerOptions) {
    this.options = options;
  }

  stopPlaying(): void {
    this.abortController.abort();
    this.abortController = new AbortController();
  }

  async playLoop(): Promise<void> {
    const eventsByTick = this.options.eventsByTick;
    // Edge case: if there are no notes, just return
    if (!eventsByTick.hasItems) {
      return;
    }

    console.log(LOG_PREFIX + "Loop info", this.options);

    const abortSignal = this.abortController.signal;
    const checkFinished = () => abortSignal.aborted;
    const items = eventsByTick.items;
    const firstEventTick = items[0].tick;
    let currentTick: number;

    while (!checkFinished()) {
      let resolveCurrentLoop: (
        value: void | PromiseLike<void>
      ) => void = () => {};
      this.currentLoopPromise = new Promise<void>((resolve) => {
        resolveCurrentLoop = resolve;
      });
      currentTick = await this.getStartingPosition(firstEventTick);
      console.log(LOG_PREFIX + `Loop starts. Current tick is %d`, currentTick);
      for (const { tick, events } of items) {
        if (checkFinished()) {
          return;
        }

        if (currentTick > tick) {
          console.log(
            LOG_PREFIX +
              "Recorded tick %d is earlier than the current tick %d. Skipping it",
            tick,
            currentTick
          );
          continue;
        }

        if (
          this.options.lastBarTickWhenStoppedRecording !== 0 && // recording spans more than one bar
          tick >= this.options.lastBarTickWhenStoppedRecording && // the event is in the last bar
          this.options.recordingStoppedInTheFirstHalfOfLastBar === true // last event was recorded in the first half of the last bar
        ) {
          console.log(
            LOG_PREFIX +
              "Last bar recording was stopped before it reached its second half. Skipping the last bar"
          );

          break; // don't play the rest of the events in the last (incomplete) bar and start the loop afresh (this allows filtering out unnecessary events)
        }

        await waitForTick(tick, currentTick, checkFinished, LOG_PREFIX);
        currentTick = tick;

        if (checkFinished()) {
          return;
        }

        this.verifyTickIsCorrect(tick);

        playAllNotes(events, LOG_PREFIX, tick);
      }
      console.log(LOG_PREFIX + "All notes in the loop are played");

      if (this.options.recordingEndedInFurtherBar === true) {
        console.log(
          LOG_PREFIX +
            "Recording ended in the further bar (not when the last event was recorded). Waiting for the tick when recording stopped and then for the first event"
        );
        await waitForTick(
          this.options.lastBarTickWhenStoppedRecording,
          currentTick,
          checkFinished,
          LOG_PREFIX
        );
      }

      console.log(LOG_PREFIX + "Waiting for a single tick to finish the loop");

      // wait for 1 tick to prevent instant replaying of the first event in the bar (for example, if the loop is just 1 event - we need to wait for a bar between replaying it. Otherwise it will just immediately repeat in a loop and will crash the browser)
      await waitForNextTick();

      console.log(LOG_PREFIX + "Loop ends");
      resolveCurrentLoop();
    }
  }

  private async getStartingPosition(firstEventTick: number) {
    const ticksPassedSinceLastBar = getCurrentRelativeTick();
    const mod = ticksPassedSinceLastBar % TICKS_IN_BAR;

    if (mod > firstEventTick) {
      console.log(
        LOG_PREFIX +
          "Waiting for the first event. Current tick %d is later than the first tick event %d - wait for the next bar and then start the loop",
        mod,
        firstEventTick
      );
      await waitForNextBar();
      return 1; // ticks are 1-based
    } else {
      if (mod < firstEventTick) {
        console.log(
          LOG_PREFIX +
            "Waiting for the first event. Current tick %d is earlier than the first tick event %d - just wait for it in the current bar",
          mod,
          firstEventTick
        );
      } else {
        console.log(
          LOG_PREFIX +
            "Waiting for the first event. Current tick %d is equal to the first event tick %d - play it immediately",
          mod,
          firstEventTick
        );
      }
      return mod;
    }
  }

  private verifyTickIsCorrect(tick: number) {
    const realTick = getCurrentRelativeTick();
    const tickInBar = tick % TICKS_IN_BAR;
    if (tickInBar !== realTick) {
      console.error(
        LOG_PREFIX +
          "Tick %d should be equal to real tick %d. Programming error",
        tickInBar,
        realTick
      );
    }
  }
}
