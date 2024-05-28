import { ChordOrNote, InternalNoteEvent } from "@/app/engine/looperData";
import { LooperPlayer, LooperPlayerOptions } from "@/app/engine/looperPlayer";
import { currentlyRecordingLooperChannel } from "@/app/engine/looperShared";
import { Instrument } from "../data/instruments";
import { StringOctaveNote } from "../data/notes";
import { ChordWithPlayMetadata } from "./eventBus";
import {
  TICKS_IN_BAR,
  TICKS_IN_BEAT,
  TICKS_IN_HALF_BAR,
  getCurrentRelativeTick,
  globalCurrentLastBarTick,
  globalCurrentTick,
} from "./mainClock";

const LOG_PREFIX = "LooperRecorder: ";

export class LooperRecorder {
  private eventsByTick: Map<number, Set<ChordOrNote>> | undefined;
  private isRecording: boolean = false;
  private absoluteStartTick: number | undefined;
  private startEventIsCloseToNewBar: boolean | undefined;
  private startEventIsExactlyAtNewBarPosition: boolean | undefined;
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
      this.absoluteStartTick === undefined ||
      this.lastBarTickForLastRecordedEvent === undefined
    ) {
      console.error(LOG_PREFIX + "Stopped recording without starting it");
      return;
    }

    if (!this.eventsByTick?.size) {
      return;
    }

    const lastBarTickWhenStoppedRecording =
      globalCurrentLastBarTick - this.absoluteStartTick;
    const endTick = globalCurrentTick - this.absoluteStartTick;
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
    if (this.absoluteStartTick === undefined) {
      console.log(LOG_PREFIX + "Absolute start tick", globalCurrentLastBarTick);
      this.absoluteStartTick = globalCurrentLastBarTick;
      firstEvent = true;
    }

    // recorded ticks are relative to the starting point
    // overwrite this value for each new event
    this.lastBarTickForLastRecordedEvent =
      globalCurrentLastBarTick - this.absoluteStartTick;
    const relativeTick = globalCurrentTick - this.absoluteStartTick;
    if (firstEvent && relativeTick > TICKS_IN_BAR - TICKS_IN_BEAT) {
      console.log(
        LOG_PREFIX +
          "The first event at tick %d is within a beat from the new bar. Shifting the ticks by 1 bar",
        relativeTick
      );
      this.startEventIsCloseToNewBar = true;
    }
    if (firstEvent && relativeTick === TICKS_IN_BAR) {
      console.log(
        LOG_PREFIX +
          "The first event at tick %d is exactly at the beginning of the bar. Adding 1 tick to it to avoid mismatch",
        relativeTick
      );
      this.startEventIsExactlyAtNewBarPosition = true;
    }

    let valueToReturn =
      this.startEventIsCloseToNewBar === true
        ? relativeTick - TICKS_IN_BAR // subtract the bar so that the first tick will get a negative number
        : relativeTick;

    if (this.startEventIsExactlyAtNewBarPosition === true) {
      valueToReturn++; // I don't know why but if start tick is 0 it mismatches with the clock. Adding 1 to all the events in the loop fixes it.
    }

    console.log(LOG_PREFIX + "Recorded event at tick", valueToReturn);

    return valueToReturn;
  }

  private initialize() {
    this.eventsByTick = new Map<number, Set<ChordOrNote>>();
    this.absoluteStartTick = undefined;
    this.startEventIsCloseToNewBar = undefined;
    this.startEventIsExactlyAtNewBarPosition = undefined;
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
