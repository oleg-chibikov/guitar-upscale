import { ChordOrNote } from "@/app/engine/looperData";
import { ChordEventBus, NotePlayEventBus } from "./eventBus";
import {
  TICKS_IN_BAR,
  getCurrentRelativeTick,
  waitForNextBar,
  waitForNextTick,
} from "./mainClock";

const LOG_PREFIX = "LooperPlayer: ";

export type LooperPlayerOptions = {
  eventsByTick: Map<number, Set<ChordOrNote>>;
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
    const sortedTicks = Array.from(this.options.eventsByTick.keys()).sort(
      (a, b) => a - b
    );

    // Edge case: if there are no notes, just return
    if (sortedTicks.length === 0) {
      return;
    }

    console.log(LOG_PREFIX + "Loop info", this.options);

    const abortSignal = this.abortController.signal;
    const firstEventTick = sortedTicks[0];
    let currentTick: number;

    while (!abortSignal.aborted) {
      let resolveCurrentLoop: (
        value: void | PromiseLike<void>
      ) => void = () => {};
      this.currentLoopPromise = new Promise<void>((resolve) => {
        resolveCurrentLoop = resolve;
      });
      currentTick = await this.getStartingPosition(firstEventTick);
      console.log(LOG_PREFIX + `Loop starts. Current tick is %d`, currentTick);
      for (const tick of sortedTicks) {
        if (abortSignal.aborted) {
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

        await this.waitForTick(tick, currentTick, abortSignal);
        currentTick = tick;

        if (abortSignal.aborted) {
          return;
        }

        this.playEventsAtTick(currentTick);
      }
      console.log(LOG_PREFIX + "All notes in the loop are played");

      if (this.options.recordingEndedInFurtherBar === true) {
        console.log(
          LOG_PREFIX +
            "Recording ended in the further bar (not when the last event was recorded). Waiting for the tick when recording stopped and then for the first event"
        );
        await this.waitForTick(
          this.options.lastBarTickWhenStoppedRecording,
          currentTick,
          abortSignal
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
    let mod = ticksPassedSinceLastBar % TICKS_IN_BAR;
    if (firstEventTick < 0) {
      // shift the current tick 1 bar before
      mod = mod - TICKS_IN_BAR;
    }

    if (mod > firstEventTick) {
      console.log(
        LOG_PREFIX +
          "Waiting for the first event. Current tick %d is later than the first tick event %d - wait for the next bar and then start the loop",
        mod,
        firstEventTick
      );
      await waitForNextBar();
      return 1; // ticks are 1-based
    } else if (mod < firstEventTick) {
      console.log(
        LOG_PREFIX +
          "Waiting for the first event. Current tick %d is earlier than the first tick event %d - just wait for it in the current bar",
        mod,
        firstEventTick
      );
      return mod;
    } else {
      console.log(
        LOG_PREFIX +
          "Waiting for the first event. Current tick %d is equal to the first event tick %d - play it immediately",
        mod,
        firstEventTick
      );
      return mod;
    }
  }

  private playEventsAtTick(tick: number) {
    const eventsAtTick = this.options.eventsByTick.get(tick);

    if (!eventsAtTick || !eventsAtTick.size) {
      return;
    }

    console.log(LOG_PREFIX + "Playing events at tick %d", tick);

    this.verifyTickIsCorrect(tick);

    eventsAtTick.forEach(({ note, chord }) => {
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
  }

  private verifyTickIsCorrect(tick: number) {
    const realTick = getCurrentRelativeTick();
    let tickInBar = tick % TICKS_IN_BAR;
    if (tickInBar < 0) {
      tickInBar += TICKS_IN_BAR;
    }

    if (tickInBar !== realTick) {
      console.error(
        LOG_PREFIX +
          "Tick %d should be equal to real tick %d. Programming error",
        tickInBar,
        realTick
      );
    }
  }

  private async waitForTick(
    tickToWaitFor: number,
    currentTick: number,
    abortSignal: AbortSignal
  ) {
    const ticksToWait = tickToWaitFor - currentTick;
    console.log(LOG_PREFIX + "Waiting for %d ticks", ticksToWait);
    for (let i = 0; i < ticksToWait; i++) {
      if (abortSignal.aborted) {
        return Promise.resolve();
      }
      await waitForNextTick();
    }
  }
}
