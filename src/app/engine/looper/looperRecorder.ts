import { chordNotesByName } from "@/app/engine/chords/chordsGenerator";
import {
  TICKS_IN_BAR,
  TICKS_IN_HALF_BAR,
  TICKS_IN_HALF_BEAT,
} from "@/app/engine/clock/clockConstants";
import { EventsByTick, NoteEvent } from "@/app/engine/eventsByTick";
import {
  LooperPlayer,
  LooperPlayerOptions,
} from "@/app/engine/looper/looperPlayer";
import { currentlyRecordingLooperChannel } from "@/app/engine/looper/looperShared";
import { NoteRecorder } from "@/app/engine/midiRecorder/noteRecorder";
import { Instrument } from "../../data/instruments";
import { StringOctaveNote } from "../../data/notes";
import {
  getCurrentRelativeTick,
  globalCurrentLastBarTick,
  globalCurrentTick,
} from "../clock/mainClock";
import { ChordWithPlayMetadata, DEFAULT_CHORD_TRACK_NUMBER } from "../eventBus";

const LOG_PREFIX = "LooperRecorder: ";

export class LooperRecorder {
  private eventsByTick: EventsByTick | undefined;
  private isRecording: boolean = false;
  private absoluteTickAtTheBeginningOfFirstEventBar: number | undefined;
  private lastBarTickForLastRecordedEvent: number | undefined;
  private looperPlayer: LooperPlayer | undefined;

  /**
   * Get the collection of all events.
   */
  get items() {
    return this.eventsByTick;
  }

  addAllItemsToNoteRecorder(noteRecorder: NoteRecorder) {
    if (!this.hasRecording()) {
      return;
    }
    for (const eventsAtTick of this.eventsByTick!.items) {
      for (const event of eventsAtTick.events) {
        const note = event.note;
        const chord = event.chord;
        if (note) {
          noteRecorder.addNoteAtTick(
            note.note,
            note.looperChannel ?? note.trackNumber,
            note.instrument ?? "acoustic_guitar_nylon",
            eventsAtTick.tick
          );
        }
        if (chord) {
          const notes = chordNotesByName.get(chord.chord);
          if (notes) {
            for (const chordNote of notes) {
              noteRecorder.addNoteAtTick(
                chordNote,
                chord.metadata.looperChannel ??
                  chord.metadata.trackNumber ??
                  DEFAULT_CHORD_TRACK_NUMBER,
                chord.metadata.trackInstrument ?? "acoustic_guitar_nylon",
                eventsAtTick.tick
              );
            }
          }
        }
      }
    }
  }

  hasRecording = () => {
    return this.eventsByTick?.hasItems ?? false;
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
      return;
    }

    if (!this.eventsByTick?.hasItems) {
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

    this.eventsByTick.addOrUpdateEvent(currentTick, data);
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

    const internalNoteEvent: NoteEvent = {
      note,
      looperChannel: currentlyRecordingLooperChannel,
      instrument,
      trackNumber,
    };

    this.eventsByTick.addOrUpdateEvent(currentTick, internalNoteEvent);
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
    this.eventsByTick = new EventsByTick();
    this.absoluteTickAtTheBeginningOfFirstEventBar = undefined;
    this.lastBarTickForLastRecordedEvent = undefined;
    this.looperPlayer = undefined;
  }
}
