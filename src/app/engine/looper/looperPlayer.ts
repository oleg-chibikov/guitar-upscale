import { TICKS_IN_BAR } from "@/app/data/clockConstants";
import { EventsByTick } from "@/app/engine/eventsByTick";
import { playAllNotes } from "@/app/engine/playerHelper";
import {
  globalCurrentLastBarTick,
  globalCurrentTick,
  isMainClockActiveValue,
  waitForNextTick,
} from "../clock/mainClock";

const LOG_PREFIX = "LooperPlayer: ";

export type LooperPlayerOptions = {
  eventsByTick: EventsByTick;
  // Whole bars. Recorded ticks start at 1 in the first bar of the loop
  loopLengthTicks: number;
};

/**
 * @param stopBarTick the tick where the bar with the recording stop starts, relative to the first bar of the loop
 */
export const getLoopLengthTicks = (
  stopBarTick: number,
  stoppedInFirstHalfOfBar: boolean
) =>
  // Stopping in the first half of a bar drops that bar, so a late press doesn't add a nearly empty bar
  Math.max(
    TICKS_IN_BAR,
    stoppedInFirstHalfOfBar ? stopBarTick : stopBarTick + TICKS_IN_BAR
  );

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
    const items = this.options.eventsByTick.items;
    if (!items.length) {
      return;
    }

    console.log(LOG_PREFIX + "Loop info", this.options);

    const { loopLengthTicks } = this.options;
    const abortSignal = this.abortController.signal;
    const checkFinished = () => abortSignal.aborted;
    let loopStartTick = this.getFirstLoopStartTick(items[0].tick);

    while (!checkFinished()) {
      let resolveCurrentLoop: (
        value: void | PromiseLike<void>
      ) => void = () => {};
      this.currentLoopPromise = new Promise<void>((resolve) => {
        resolveCurrentLoop = resolve;
      });
      console.log(
        LOG_PREFIX + "Loop starts at global tick %d, length %d ticks",
        loopStartTick,
        loopLengthTicks
      );

      for (const { tick, events } of items) {
        if (tick > loopLengthTicks) {
          console.log(
            LOG_PREFIX +
              "Recorded tick %d is past the loop end. Skipping the rest of the events",
            tick
          );
          break;
        }

        const targetTick = loopStartTick + tick;
        if (globalCurrentTick > targetTick) {
          console.log(
            LOG_PREFIX +
              "Recorded tick %d is earlier than the current tick. Skipping it",
            tick
          );
          continue;
        }

        if (!(await this.waitForGlobalTick(targetTick, checkFinished))) {
          resolveCurrentLoop();
          return;
        }

        playAllNotes(events, LOG_PREFIX, tick);
      }

      console.log(LOG_PREFIX + "Loop ends");
      loopStartTick += loopLengthTicks;
      resolveCurrentLoop();
    }
  }

  private getFirstLoopStartTick(firstEventTick: number) {
    const tickInBar = globalCurrentTick - globalCurrentLastBarTick;
    if (tickInBar <= firstEventTick) {
      console.log(
        LOG_PREFIX +
          "Current tick %d is not later than the first event tick %d. Starting the loop in the current bar",
        tickInBar,
        firstEventTick
      );
      return globalCurrentLastBarTick;
    }

    console.log(
      LOG_PREFIX +
        "Current tick %d is later than the first event tick %d. Starting the loop in the next bar",
      tickInBar,
      firstEventTick
    );
    return globalCurrentLastBarTick + TICKS_IN_BAR;
  }

  private async waitForGlobalTick(
    targetTick: number,
    checkFinished: () => boolean
  ) {
    while (globalCurrentTick < targetTick) {
      // A stopped clock resolves every wait straight away, so looping here would freeze the page
      if (checkFinished() || !isMainClockActiveValue) {
        return false;
      }
      await waitForNextTick();
    }
    return !checkFinished();
  }
}
