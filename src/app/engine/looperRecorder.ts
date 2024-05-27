import { currentlyRecordingLooperChannel } from "@/app/engine/looperShared";
import { Instrument } from "../data/instruments";
import { StringOctaveNote } from "../data/notes";
import {
  ChordEventBus,
  ChordWithPlayMetadata,
  NotePlayEventBus,
} from "./eventBus";
import {
  TICKS_IN_BAR,
  TICKS_IN_HALF_BAR,
  globalCurrentLastBarTick,
  globalCurrentTick,
  waitForNextBar,
  waitForNextTick,
} from "./mainClock";

const LOG_PREFIX = "Looper: ";

type InternalNoteEvent = {
  note: StringOctaveNote;
  tick: number;
  looperChannel: number;
  trackNumber: number;
  instrument: Instrument;
};

type ChordOrNote = {
  note?: InternalNoteEvent;
  chord?: ChordWithPlayMetadata;
};

export class LooperRecorder {
  private eventsByTick: Map<number, Set<ChordOrNote>> | undefined;
  private isRecording: boolean = false;
  private absoluteStartTick: number | undefined;
  private lastBarTickWhenStoppedRecording: number | undefined;
  private lastBarTickForLastRecordedEvent: number | undefined;
  private endTick: number | undefined;
  private recordingEndedInFurtherBar: boolean | undefined;
  private recordingStoppedInTheFirstHalfOfLastBar: boolean | undefined;
  private abortController = new AbortController();

  // TODO: Instead of keeping this complex logic we can just start strumming from whatever position we currently have in the bar.
  // For example if we are at 30th tick, then we skip events in the strumming pattern that come before that.
  // This way we won't need to play this unwanted extra event at all.
  private clearUndesiredChordCallbacks: Map<number, Set<() => void>> = new Map<
    number,
    Set<() => void>
  >(); // key is the strumming sequence id (click number). Value is the function that deletes the undesired events for this strumming sequence

  hasRecording = () => {
    const size = this.eventsByTick?.size;
    return size !== undefined ? size > 0 : false;
  };

  clear = () => {
    this.initialize();
    this.stopPlaying();
  };

  startRecording() {
    this.isRecording = true;
    this.initialize();
  }

  stopRecording() {
    this.isRecording = false;
    if (this.absoluteStartTick !== undefined) {
      this.lastBarTickWhenStoppedRecording =
        globalCurrentLastBarTick - this.absoluteStartTick;
      this.endTick = globalCurrentTick - this.absoluteStartTick;
      this.recordingStoppedInTheFirstHalfOfLastBar =
        globalCurrentTick - globalCurrentLastBarTick < TICKS_IN_HALF_BAR;

      if (this.lastBarTickForLastRecordedEvent !== undefined) {
        this.recordingEndedInFurtherBar =
          this.lastBarTickWhenStoppedRecording >
          this.lastBarTickForLastRecordedEvent;
      } else {
        // no events
        this.recordingEndedInFurtherBar = true;
      }
    }
  }

  stopPlaying(): void {
    this.abortController.abort();
    this.abortController = new AbortController();
  }

  async playLoop(): Promise<void> {
    if (
      !this.eventsByTick ||
      this.endTick === undefined ||
      this.lastBarTickForLastRecordedEvent === undefined ||
      this.lastBarTickWhenStoppedRecording === undefined
    ) {
      return;
    }

    const sortedTicks = Array.from(this.eventsByTick.keys()).sort(
      (a, b) => a - b
    );

    // Edge case: if there are no notes, just return
    if (sortedTicks.length === 0) {
      return;
    }

    console.log(
      LOG_PREFIX +
        `Loop info
      All ticks in the loop: %s,
      Last event tick: %d,
      Last bar tick for last recorded event: %d
      ---
      End recording tick: %d
      Last bar tick when recording was stopped: %d
      Recording ended in the further bar than the last event: %s
      Recording stopped in the first half of the last bar: %s`,
      sortedTicks.join(", "),
      sortedTicks[sortedTicks.length - 1],
      this.lastBarTickForLastRecordedEvent,
      this.endTick,
      this.lastBarTickWhenStoppedRecording,
      this.recordingEndedInFurtherBar,
      this.recordingStoppedInTheFirstHalfOfLastBar
    );

    const abortSignal = this.abortController.signal;
    const firstEventTick = sortedTicks[0];
    let ticksPassedSinceLastBar = globalCurrentTick - globalCurrentLastBarTick;

    while (!abortSignal.aborted) {
      let currentTick: number = await this.waitForFirstEvent(
        ticksPassedSinceLastBar,
        firstEventTick
      );
      console.log(LOG_PREFIX + `Loop starts. Current tick is %d`, currentTick);
      for (const tick of sortedTicks) {
        if (abortSignal.aborted) {
          return;
        }

        // TODO: Remove redundant checks and variables
        if (
          this.lastBarTickWhenStoppedRecording !== 0 && // recording spans more than one bar
          tick >= this.lastBarTickWhenStoppedRecording && // the event is in the last bar
          this.recordingStoppedInTheFirstHalfOfLastBar === true // last event was recorded in the first half of the last bar
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

      if (this.recordingEndedInFurtherBar === true) {
        console.log(
          LOG_PREFIX +
            "Recording ended in the further bar (not when the last event was recorded). Waiting for the tick when recording stopped and then for the first event"
        );
        await this.waitForTick(
          this.lastBarTickWhenStoppedRecording,
          currentTick,
          abortSignal
        );
      }

      console.log(LOG_PREFIX + "Waiting for a single tick to finish the loop");
      // wait for 1 tick to prevent instant replaying of the first event in the bar (for example, if the loop is just 1 event - we need to wait for a bar between replaying it. Otherwise it will just immediately repeat in a loop and will crash the browser)
      await waitForNextTick();
      currentTick++;
      // we'll need to wait for the first note in the current bar or in the next bar, the same way as when the loop started for the first time, but the current note now is the last note of the loop
      ticksPassedSinceLastBar = currentTick;

      console.log(LOG_PREFIX + "Loop ends");
    }
  }

  private async waitForFirstEvent(
    ticksPassedSinceLastBar: number,
    firstEventTick: number
  ) {
    const mod = ticksPassedSinceLastBar % TICKS_IN_BAR;
    if (mod > firstEventTick) {
      console.log(
        LOG_PREFIX +
          "Waiting for the first event. Current tick %d is later than the first event %d - wait for the next bar first",
        mod,
        firstEventTick
      );
      await waitForNextBar();
      return 0;
    } else {
      console.log(
        LOG_PREFIX +
          "Waiting for the first event. Current tick %d is earlier than the first event %d - just wait for it in the current bar",
        mod,
        firstEventTick
      );
      return mod;
    }
  }

  private playEventsAtTick(tick: number) {
    if (!this.eventsByTick) {
      return;
    }

    const eventsAtTick = this.eventsByTick.get(tick);

    if (!eventsAtTick || !eventsAtTick.size) {
      return;
    }

    console.log(LOG_PREFIX + "Playing events at tick %d", tick);

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

  private setStartTickAndGetCurrentTick() {
    if (this.absoluteStartTick === undefined) {
      console.log(LOG_PREFIX + "Absolute start tick", globalCurrentLastBarTick);
      this.absoluteStartTick = globalCurrentLastBarTick;
    }

    // recorded ticks are relative to the starting point
    this.recordLastBarTickForLastRecordedEvent(this.absoluteStartTick);
    return globalCurrentTick - this.absoluteStartTick;
  }

  recordChord(data: ChordWithPlayMetadata) {
    if (
      !this.isRecording ||
      !this.eventsByTick ||
      currentlyRecordingLooperChannel === undefined
    ) {
      return;
    }

    data.metadata.looperChannel = currentlyRecordingLooperChannel;

    const currentTick = this.setStartTickAndGetCurrentTick();

    const eventData: ChordOrNote = { chord: data };
    const eventsForTick = this.addOrUpdateEvent(currentTick, eventData);

    const removeEvent = () => {
      console.log(
        LOG_PREFIX + "Removing undesired event as strumming continues",
        eventData
      );
      eventsForTick.delete(eventData);
      if (!eventsForTick.size) {
        console.log(
          LOG_PREFIX +
            "No more events at tick %d. Deleting the events container for it",
          currentTick
        );
        this.eventsByTick?.delete(currentTick);
      }
    };

    this.registerUndesiredStrummingEvent(
      data.metadata.strummingClickNumber,
      data.metadata.playedSeparatelyFromStrumming ?? false,
      removeEvent
    );

    this.eventsByTick.set(currentTick, eventsForTick);
  }

  recordNote(
    note: StringOctaveNote,
    trackNumber: number,
    instrument: Instrument
  ) {
    if (
      !this.isRecording ||
      !this.eventsByTick ||
      currentlyRecordingLooperChannel === undefined
    ) {
      return;
    }

    const currentTick = this.setStartTickAndGetCurrentTick();

    const internalNoteEvent: InternalNoteEvent = {
      tick: currentTick,
      note,
      looperChannel: currentlyRecordingLooperChannel,
      instrument,
      trackNumber,
    };

    const eventsForTick = this.addOrUpdateEvent(currentTick, {
      note: internalNoteEvent,
    });

    this.eventsByTick.set(currentTick, eventsForTick);
  }

  private recordLastBarTickForLastRecordedEvent = (startTick: number) => {
    // overwrite this value for each new event
    this.lastBarTickForLastRecordedEvent = globalCurrentLastBarTick - startTick;
  };

  private initialize() {
    this.eventsByTick = new Map<number, Set<ChordOrNote>>();
    this.absoluteStartTick = undefined;
    this.endTick = undefined;

    this.lastBarTickWhenStoppedRecording = undefined;
    this.lastBarTickForLastRecordedEvent = undefined;

    this.recordingEndedInFurtherBar = undefined;
    this.recordingStoppedInTheFirstHalfOfLastBar = undefined;
  }

  private addOrUpdateEvent(currentTick: number, data: ChordOrNote) {
    let eventsForTick = this.eventsByTick!.get(currentTick);
    if (!eventsForTick) {
      eventsForTick = new Set([data]);
    } else {
      eventsForTick.add(data);
    }
    return eventsForTick;
  }

  private registerUndesiredStrummingEvent(
    strummingClickNumber: number | undefined,
    fromImmediateChord: boolean,
    removeEvent: () => void
  ) {
    if (strummingClickNumber !== undefined) {
      console.log(
        LOG_PREFIX + "Note from strumming sequence",
        strummingClickNumber
      );
      if (fromImmediateChord) {
        console.log(
          LOG_PREFIX +
            "Registering note events coming from an immediate chord as possibly undesired for strumming sequence",
          strummingClickNumber
        );
        // create and store the callback to remove these notes once we receive the note from strumming
        // disclaimer: when strumming while main clock is active we play the first chord straight away and it is not the part of strumming. It is needed to be able to play single chords.
        // but in looper or recording we don't wanna have such chords if they are followed by the actual strumming
        // therefore we need to delete them from the play sequence.
        // We only need to delete events for the same strumming sequence. It's done by storing them in a map keyed by the strumming sequence id

        this.createOrAddUndesiredStrummingCallback(
          strummingClickNumber,
          removeEvent
        );
      } else {
        console.log(LOG_PREFIX + "Strumming continues");
        // if we are here it means that we continue strumming. We need to wipe the unwanted events coming from the same sequence (the chord that was played immediately, before strumming)
        const clearUndesiredChordCallbacksForThisSequence =
          this.clearUndesiredChordCallbacks.get(strummingClickNumber);
        if (
          clearUndesiredChordCallbacksForThisSequence &&
          clearUndesiredChordCallbacksForThisSequence.size
        ) {
          console.log(LOG_PREFIX + "Removing undesired events");
          clearUndesiredChordCallbacksForThisSequence.forEach((callback) =>
            callback()
          );
          clearUndesiredChordCallbacksForThisSequence.clear();
          this.clearUndesiredChordCallbacks.delete(strummingClickNumber);
        }
      }
    } else {
      console.log(LOG_PREFIX + "Note not from strumming sequence");
    }
  }

  private createOrAddUndesiredStrummingCallback(
    strummingClickNumber: number,
    deleteUndesiredNoteCallback: () => void
  ) {
    let currentCallbacksForThisSequence =
      this.clearUndesiredChordCallbacks.get(strummingClickNumber);
    if (currentCallbacksForThisSequence) {
      currentCallbacksForThisSequence.add(deleteUndesiredNoteCallback);
    } else {
      currentCallbacksForThisSequence = new Set([deleteUndesiredNoteCallback]);
    }
    this.clearUndesiredChordCallbacks.set(
      strummingClickNumber,
      currentCallbacksForThisSequence
    );
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
