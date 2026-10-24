import { debugLog } from "@/app/helpers/debugLog";
import { TICKS_IN_BAR } from "@/app/data/clockConstants";
import { EventsByTick } from "@/app/engine/eventsByTick";
import { getAudibleEvents } from "@/app/engine/pianoRoll/soloTrack";
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
  stoppedInFirstHalfOfBar: boolean,
) =>
  // Stopping in the first half of a bar drops that bar, so a late press doesn't add a nearly empty bar
  Math.max(
    TICKS_IN_BAR,
    stoppedInFirstHalfOfBar ? stopBarTick : stopBarTick + TICKS_IN_BAR,
  );

export class LooperPlayer {
  private options: LooperPlayerOptions;
  private abortController = new AbortController();

  // for testing - allows to wait for the current loop to finish
  currentLoopPromise: Promise<void> | undefined;
  // global tick where the running loop started. Undefined while stopped
  private loopStartTick: number | undefined;

  constructor(options: LooperPlayerOptions) {
    this.options = options;
  }

  stopPlaying(): void {
    this.abortController.abort();
    this.abortController = new AbortController();
    this.loopStartTick = undefined;
  }

  get loopLengthTicks() {
    return this.options.loopLengthTicks;
  }

  /**
   * The tick inside the loop that the clock is at, for the piano roll playhead
   */
  get positionInLoop(): number | undefined {
    if (this.loopStartTick === undefined) {
      return undefined;
    }
    // the next pass sets its start before the clock gets there, so wrap negative positions too
    const length = this.options.loopLengthTicks;
    return (
      (((globalCurrentTick - this.loopStartTick) % length) + length) % length
    );
  }

  async playLoop(): Promise<void> {
    let items = this.options.eventsByTick.items;
    if (!items.length) {
      return;
    }

    debugLog(LOG_PREFIX + "Loop info", this.options);

    const { loopLengthTicks } = this.options;
    const abortSignal = this.abortController.signal;
    const checkFinished = () => abortSignal.aborted;
    let loopStartTick = this.getFirstLoopStartTick(items[0].tick);

    while (!checkFinished()) {
      // the piano roll can edit the loop while it plays. Changes land on the next pass
      items = this.options.eventsByTick.items;
      this.loopStartTick = loopStartTick;
      let resolveCurrentLoop: (
        value: void | PromiseLike<void>,
      ) => void = () => {};
      this.currentLoopPromise = new Promise<void>((resolve) => {
        resolveCurrentLoop = resolve;
      });
      let waited = false;
      debugLog(
        LOG_PREFIX + "Loop starts at global tick %d, length %d ticks",
        loopStartTick,
        loopLengthTicks,
      );

      for (const { tick, events } of items) {
        if (tick > loopLengthTicks) {
          debugLog(
            LOG_PREFIX +
              "Recorded tick %d is past the loop end. Skipping the rest of the events",
            tick,
          );
          break;
        }

        const targetTick = loopStartTick + tick;
        if (globalCurrentTick > targetTick) {
          debugLog(
            LOG_PREFIX +
              "Recorded tick %d is earlier than the current tick. Skipping it",
            tick,
          );
          continue;
        }

        waited = true;
        if (!(await this.waitForGlobalTick(targetTick, checkFinished))) {
          resolveCurrentLoop();
          return;
        }

        playAllNotes(
          getAudibleEvents(this.options.eventsByTick, events),
          LOG_PREFIX,
          tick,
        );
      }

      // a pass with nothing to play, say after the piano roll deleted every note, still waits out the loop.
      // Without the wait the loop would spin and freeze the page
      if (
        !waited &&
        !(await this.waitForGlobalTick(
          loopStartTick + loopLengthTicks,
          checkFinished,
        ))
      ) {
        resolveCurrentLoop();
        return;
      }

      debugLog(LOG_PREFIX + "Loop ends");
      loopStartTick += loopLengthTicks;
      resolveCurrentLoop();
    }
  }

  private getFirstLoopStartTick(firstEventTick: number) {
    const tickInBar = globalCurrentTick - globalCurrentLastBarTick;
    if (tickInBar <= firstEventTick) {
      debugLog(
        LOG_PREFIX +
          "Current tick %d is not later than the first event tick %d. Starting the loop in the current bar",
        tickInBar,
        firstEventTick,
      );
      return globalCurrentLastBarTick;
    }

    debugLog(
      LOG_PREFIX +
        "Current tick %d is later than the first event tick %d. Starting the loop in the next bar",
      tickInBar,
      firstEventTick,
    );
    return globalCurrentLastBarTick + TICKS_IN_BAR;
  }

  private async waitForGlobalTick(
    targetTick: number,
    checkFinished: () => boolean,
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
