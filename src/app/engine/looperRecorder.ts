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
  waitForNextTick,
} from "./mainClock";

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
  private midiEventsByTick: Map<number, Set<ChordOrNote>> | undefined;
  private isRecording: boolean = false;
  private startTick: number | undefined;
  private lastBarTickWhenStoppedRecording: number | undefined;
  private endTick: number | undefined;
  private recordingStoppedAtTheFirstHalfOfLastBar: boolean | undefined;
  private abortController = new AbortController();

  // TODO: Instead of keeping this complex logic we can just start strumming from whatever position we currently have in the bar.
  // For example if we are at 30th tick, then we skip events in the strumming pattern that come before that.
  // This way we won't need to play this unwanted extra event at all.
  private clearUndesiredChordCallbacks: Map<number, Set<() => void>> = new Map<
    number,
    Set<() => void>
  >(); // key is the strumming sequence id (click number). Value is the function that deletes the undesired events for this strumming sequence

  hasRecording = () => {
    const size = this.midiEventsByTick?.size;
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
    this.lastBarTickWhenStoppedRecording = globalCurrentLastBarTick;
    this.endTick = globalCurrentTick;
    this.recordingStoppedAtTheFirstHalfOfLastBar =
      this.endTick - this.lastBarTickWhenStoppedRecording < TICKS_IN_HALF_BAR;
  }

  stopPlaying(): void {
    this.abortController.abort();
    this.abortController = new AbortController();
  }

  async playMidi(): Promise<void> {
    if (
      !this.midiEventsByTick ||
      this.lastBarTickWhenStoppedRecording === undefined
    ) {
      return;
    }

    const sortedTicks = Array.from(this.midiEventsByTick.keys()).sort(
      (a, b) => a - b
    );

    // Edge case: if there are no notes, just return
    if (sortedTicks.length === 0) {
      return;
    }

    const abortSignal = this.abortController.signal;
    const firstNoteTick = sortedTicks[0];
    let ticksPassedSinceLastBar = globalCurrentTick - globalCurrentLastBarTick;

    while (!abortSignal.aborted) {
      let currentTick = this.getStartingTick(
        ticksPassedSinceLastBar,
        firstNoteTick
      );
      console.log("---Start playing from tick %d", currentTick);

      for (const tick of sortedTicks) {
        if (abortSignal.aborted) {
          return;
        }

        if (
          this.lastBarTickWhenStoppedRecording !== this.startTick && // if recording spans more than one bar
          tick >= this.lastBarTickWhenStoppedRecording && // we arch at the tick from the last bar
          this.recordingStoppedAtTheFirstHalfOfLastBar === true // we keep the last bar if the recording stopped in its second half (regardless of notes being recorded)
        ) {
          console.log(
            "Last bar recording was stopped before it reached its second half. Skipping the last bar"
          );
          break; // don't play the rest of the events in the last (incomplete) bar and start the loop afresh
        }

        await this.waitForTick(tick, currentTick, abortSignal);

        if (abortSignal.aborted || this.midiEventsByTick === undefined) {
          return;
        }

        this.playNotesAtTick(tick);

        await waitForNextTick();
        currentTick = tick + 1; // +1 to avoid the situation where we have a single note/chord and it keeps playing immediately
      }

      ticksPassedSinceLastBar =
        currentTick - this.lastBarTickWhenStoppedRecording;

      // if (this.endTick !== undefined && this.endTick > currentTick) {
      //   console.log("---Waiting for the end tick");
      //   // wait if the intention was to add the silence after the melody
      //   await this.waitForTick(this.endTick, currentTick, abortSignal);
      // }

      // wait till the end of the bar and then repeat
    }
  }

  private getStartingTick(
    ticksPassedSinceLastBar: number,
    firstNoteTick: number
  ) {
    const ticksTillNextBar = TICKS_IN_BAR - ticksPassedSinceLastBar;
    // startTick is the tick number at the start of the bar closest to the first recorded note (not the value when the record button was clicked)
    const startTick = this.startTick ?? 0;

    const ticksFromStartToFirst = firstNoteTick - startTick!;

    // Imagine an example: first note - 10 ticks from start of the bar
    // we are at 9th tick now - we can play the first note in 1 tick and play the rest of the melody.
    // we are at 11th tick now - we need to wait till the bar start, then wait for 10 ticks.
    let ticksToWaitForTheFirstNote: number;
    if (ticksPassedSinceLastBar <= ticksFromStartToFirst) {
      ticksToWaitForTheFirstNote =
        ticksFromStartToFirst - ticksPassedSinceLastBar;
      console.log(
        "---We are at tick %d now. First note starts at %d tick. We need to wait for %d ticks to play the first note",
        startTick + ticksPassedSinceLastBar,
        startTick + ticksFromStartToFirst,
        ticksToWaitForTheFirstNote
      );
    } else {
      ticksToWaitForTheFirstNote = ticksTillNextBar + ticksFromStartToFirst;
      console.log(
        "---We are at tick %d now. First note starts at %d tick. We need to wait for the next bar and then %d ticks to play the first note (%d ticks in total)",
        startTick + ticksPassedSinceLastBar,
        startTick + ticksFromStartToFirst,
        ticksFromStartToFirst,
        ticksToWaitForTheFirstNote
      );
    }

    const playStartTick = firstNoteTick - ticksToWaitForTheFirstNote;

    return playStartTick;
  }

  private playNotesAtTick(tick: number) {
    const eventsAtTick = this.midiEventsByTick!.get(tick);

    if (!eventsAtTick || !eventsAtTick.size) {
      return;
    }

    console.log("Playing notes at tick %d", tick);

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

  recordChord(data: ChordWithPlayMetadata) {
    if (
      !this.isRecording ||
      !this.midiEventsByTick ||
      currentlyRecordingLooperChannel === undefined
    ) {
      return;
    }

    data.metadata.looperChannel = currentlyRecordingLooperChannel;
    const currentTick = globalCurrentTick;
    if (this.startTick === undefined) {
      this.startTick = globalCurrentLastBarTick;
    }

    const eventData: ChordOrNote = { chord: data };
    const eventsForTick = this.addOrUpdateEvent(currentTick, eventData);

    const removeEvent = () => {
      console.log("Removing undesired event as strumming continues", eventData);
      eventsForTick.delete(eventData);
      if (!eventsForTick.size) {
        console.log(
          "No more events at tick %d. Deleting the events container for it",
          currentTick
        );
        this.midiEventsByTick?.delete(currentTick);
      }
    };

    this.registerUndesiredStrummingEvent(
      data.metadata.strummingClickNumber,
      data.metadata.playedSeparatelyFromStrumming ?? false,
      removeEvent
    );

    this.midiEventsByTick.set(currentTick, eventsForTick);
  }

  recordNote(
    note: StringOctaveNote,
    trackNumber: number,
    instrument: Instrument
  ) {
    if (
      !this.isRecording ||
      !this.midiEventsByTick ||
      currentlyRecordingLooperChannel === undefined
    ) {
      return;
    }

    const currentTick = globalCurrentTick;
    if (this.startTick === undefined) {
      this.startTick = globalCurrentLastBarTick;
    }

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

    this.midiEventsByTick.set(currentTick, eventsForTick);
  }

  private initialize() {
    this.midiEventsByTick = new Map<number, Set<ChordOrNote>>();
    this.startTick = undefined;
    this.lastBarTickWhenStoppedRecording = undefined;
    this.endTick = undefined;
    this.recordingStoppedAtTheFirstHalfOfLastBar = undefined;
  }

  private addOrUpdateEvent(currentTick: number, data: ChordOrNote) {
    let eventsForTick = this.midiEventsByTick!.get(currentTick);
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
      console.log("Note from strumming sequence", strummingClickNumber);
      if (fromImmediateChord) {
        console.log(
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
        console.log("Strumming continues");
        // if we are here it means that we continue strumming. We need to wipe the unwanted events coming from the same sequence (the chord that was played immediately, before strumming)
        const clearUndesiredChordCallbacksForThisSequence =
          this.clearUndesiredChordCallbacks.get(strummingClickNumber);
        if (
          clearUndesiredChordCallbacksForThisSequence &&
          clearUndesiredChordCallbacksForThisSequence.size
        ) {
          console.log("Removing undesired events");
          clearUndesiredChordCallbacksForThisSequence.forEach((callback) =>
            callback()
          );
          clearUndesiredChordCallbacksForThisSequence.clear();
          this.clearUndesiredChordCallbacks.delete(strummingClickNumber);
        }
      }
    } else {
      console.log("Note not from strumming sequence");
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

    for (let i = 0; i < ticksToWait; i++) {
      if (abortSignal.aborted) {
        return Promise.resolve();
      }
      await waitForNextTick();
    }
  }
}
