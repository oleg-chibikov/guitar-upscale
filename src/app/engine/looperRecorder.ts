import { ChordOrNote, InternalNoteEvent } from "@/app/engine/looperData";
import { LooperPlayer, LooperPlayerOptions } from "@/app/engine/looperPlayer";
import { currentlyRecordingLooperChannel } from "@/app/engine/looperShared";
import { Instrument } from "../data/instruments";
import { StringOctaveNote } from "../data/notes";
import { ChordWithPlayMetadata } from "./eventBus";
import {
  TICKS_IN_BAR,
  TICKS_IN_HALF_BAR,
  TICKS_IN_HALF_BEAT,
  getCurrentRelativeTick,
  globalCurrentLastBarTick,
  globalCurrentTick,
} from "./mainClock";

const LOG_PREFIX = "LooperRecorder: ";

export class LooperRecorder {
  private eventsByTick: Map<number, Set<ChordOrNote>> | undefined;
  private isRecording: boolean = false;
  private absoluteTickAtTheBeginningOfFirstEventBar: number | undefined;
  private lastBarTickForLastRecordedEvent: number | undefined;
  private looperPlayer: LooperPlayer | undefined;

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
    if (
      this.absoluteTickAtTheBeginningOfFirstEventBar === undefined ||
      this.lastBarTickForLastRecordedEvent === undefined
    ) {
      console.error(LOG_PREFIX + "Stopped recording without starting it");
      return;
    }

    if (!this.eventsByTick?.size) {
      return;
    }

    const lastBarTickWhenStoppedRecording =
      globalCurrentLastBarTick - this.absoluteTickAtTheBeginningOfFirstEventBar;
    const endTick =
      globalCurrentTick - this.absoluteTickAtTheBeginningOfFirstEventBar;
    const recordingStoppedInTheFirstHalfOfLastBar =
      getCurrentRelativeTick() < TICKS_IN_HALF_BAR;

    const recordingEndedInFurtherBar =
      lastBarTickWhenStoppedRecording > this.lastBarTickForLastRecordedEvent;

    const options: LooperPlayerOptions = {
      eventsByTick: this.eventsByTick,
      lastBarTickWhenStoppedRecording,
      lastBarTickForLastRecordedEvent: this.lastBarTickForLastRecordedEvent,
      endTick,
      recordingEndedInFurtherBar,
      recordingStoppedInTheFirstHalfOfLastBar,
    };

    this.looperPlayer = new LooperPlayer(options);
  }

  async startPlaying(): Promise<void> {
    if (this.looperPlayer === undefined) {
      console.error(LOG_PREFIX + "Starting playing without a recording");
      return;
    }
    await this.looperPlayer?.playLoop();
  }

  stopPlaying(): void {
    if (this.looperPlayer === undefined) {
      console.error(LOG_PREFIX + "Stopped playing without a recording");
      return;
    }
    this.looperPlayer?.stopPlaying();
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
    if (currentTick === undefined) {
      // don't record this event
      return;
    }

    const eventData: ChordOrNote = { chord: data };
    const eventsForTick = this.addOrUpdateEvent(currentTick, eventData);

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
    if (currentTick === undefined) {
      // don't record this event
      return;
    }

    const internalNoteEvent: InternalNoteEvent = {
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

  private setStartTickAndGetCurrentTick() {
    let firstEvent = false;
    if (this.absoluteTickAtTheBeginningOfFirstEventBar === undefined) {
      console.log(LOG_PREFIX + "Absolute start tick", globalCurrentLastBarTick);
      this.absoluteTickAtTheBeginningOfFirstEventBar = globalCurrentLastBarTick;
      firstEvent = true;
    }

    // recorded ticks are relative to the starting point
    // overwrite this value for each new event
    const relativeTick =
      globalCurrentTick - this.absoluteTickAtTheBeginningOfFirstEventBar;
    if (firstEvent) {
      if (relativeTick > TICKS_IN_BAR - TICKS_IN_HALF_BEAT) {
        // first event is very close to the end of the bar
        this.absoluteTickAtTheBeginningOfFirstEventBar += TICKS_IN_BAR; // Consider the next bar as the starting point
        this.lastBarTickForLastRecordedEvent = 1;
        console.log(
          LOG_PREFIX +
            "The first event at tick %d is within a half beat from the new bar. Shifting the ticks by 1 bar and setting the first tick to 1",
          relativeTick
        );
        return 1; // ticks are 1-based
      }
    } else {
      // subsequent event
      if (globalCurrentTick <= this.absoluteTickAtTheBeginningOfFirstEventBar) {
        console.log(
          "The event is not first and the new bar hasn't yet started. Ignoring the event"
        );
        return undefined;
      }

      // update the last bar number with every new event - it will point to the last one
      this.lastBarTickForLastRecordedEvent =
        globalCurrentLastBarTick -
        this.absoluteTickAtTheBeginningOfFirstEventBar;
    }

    console.log(LOG_PREFIX + "Recorded event at tick", relativeTick);

    return relativeTick;
  }

  private initialize() {
    this.eventsByTick = new Map<number, Set<ChordOrNote>>();
    this.absoluteTickAtTheBeginningOfFirstEventBar = undefined;
    this.lastBarTickForLastRecordedEvent = undefined;
    this.looperPlayer = undefined;
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
}
