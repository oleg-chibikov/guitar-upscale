import { Instrument } from "../data/instruments";
import { StringOctaveNote, getNoteText } from "../data/notes";
import { NotePlayEventBus } from "./eventBus";
import {
  TICKS_IN_BAR,
  globalCurrentLastBarTick,
  globalCurrentTick,
  waitForNextTick,
} from "./mainClock";

type InternalNoteEvent = {
  note: StringOctaveNote;
  tick: number;
  trackNumber: number;
  instrument: Instrument;
};

export class LooperRecorder {
  private midiEventsByTick: Map<number, Set<InternalNoteEvent>> | undefined;
  private isRecording: boolean = false;
  private startTick: number | undefined;
  private lastBarTickWhenStoppedRecording: number | undefined;
  private abortController = new AbortController();

  // TODO: Instead of keeping this complex logic we can just start strumming from whatever position we currently have in the bar.
  // For example if we are at 30th tick, then we skip events in the strumming pattern that come before that.
  // This way we won't need to play this unwanted extra event at all.
  private clearUndesiredChordCallbacks: Map<number, Set<() => void>> = new Map<
    number,
    Set<() => void>
  >(); // key is the strumming sequence id (click number). Value is the function that deletes the undesired events for this strumming sequence

  startRecording() {
    this.midiEventsByTick = new Map<number, Set<InternalNoteEvent>>();
    this.isRecording = true;
    this.startTick = undefined;
    this.lastBarTickWhenStoppedRecording = undefined;
  }

  stopRecordingWithoutClearing() {
    this.isRecording = false;
    this.lastBarTickWhenStoppedRecording = globalCurrentLastBarTick;
  }

  stopPlaying(): void {
    this.abortController.abort();
    this.abortController = new AbortController();
  }

  async playMidi(): Promise<void> {
    const abortSignal = this.abortController.signal;
    if (!this.midiEventsByTick) {
      return;
    }

    const sortedTicks = Array.from(this.midiEventsByTick.keys()).sort(
      (a, b) => a - b
    );

    // Edge case: if there are no notes, just return
    if (sortedTicks.length === 0) {
      return;
    }
    const firstNoteTick = sortedTicks[0];

    let ticksPassedSinceLastBar = globalCurrentTick - globalCurrentLastBarTick;

    while (!abortSignal.aborted) {
      console.log("---Start playing");

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

      let currentTick = playStartTick;

      for (const tick of sortedTicks) {
        if (abortSignal.aborted) {
          return;
        }

        await this.waitForTick(tick, currentTick, abortSignal);

        if (abortSignal.aborted || !this.midiEventsByTick) {
          return;
        }

        this.playNotesAtTick(tick);

        currentTick = tick;
      }

      ticksPassedSinceLastBar =
        currentTick - this.lastBarTickWhenStoppedRecording!;

      // if (this.endTick !== undefined && this.endTick > currentTick) {
      //   console.log("---Waiting for the end tick");
      //   // wait if the intention was to add the silence after the melody
      //   await this.waitForTick(this.endTick, currentTick, abortSignal);
      // }

      // wait till the end of the bar and then repeat
    }
  }

  private playNotesAtTick(tick: number) {
    const eventsAtTick = this.midiEventsByTick!.get(tick);

    if (!eventsAtTick?.size) {
      return;
    }

    console.log("Playing notes at tick %d", tick);

    eventsAtTick.forEach(({ note, trackNumber, instrument }) => {
      NotePlayEventBus.next({
        stringOctaveNote: note,
        fromChord: false,
        fromLooper: true,
        trackInstrument: instrument,
        trackNumber,
        skipChordDetection: true,
      });
    });
  }

  recordNote(
    note: StringOctaveNote,
    trackNumber: number,
    instrument: Instrument,
    fromImmediateChord: boolean,
    strummingClickNumber?: number
  ) {
    if (!this.isRecording || !this.midiEventsByTick) {
      return;
    }
    const currentTick = globalCurrentTick;
    if (this.startTick === undefined) {
      this.startTick = globalCurrentLastBarTick;
    }
    const playAtTick = currentTick - this.startTick;
    console.log(
      `Recording ${getNoteText(note.note)}${
        note.octave
      }; delta: ${playAtTick} ticks`
    );
    const internalNoteEvent: InternalNoteEvent = {
      tick: currentTick,
      note,
      trackNumber,
      instrument,
    };
    let eventsForTick = this.midiEventsByTick.get(currentTick);
    if (!eventsForTick) {
      eventsForTick = new Set([internalNoteEvent]);
    } else {
      eventsForTick.add(internalNoteEvent);
    }

    const removeEvent = () => {
      console.log(
        "Removing undesired event as strumming continues",
        internalNoteEvent
      );
      eventsForTick.delete(internalNoteEvent);
      if (!eventsForTick.size) {
        console.log(
          "No more events at tick %d. Deleting the events container for it",
          currentTick
        );
        this.midiEventsByTick?.delete(currentTick);
      }
    };

    this.registerUndesiredStrummingEvent(
      strummingClickNumber,
      fromImmediateChord,
      removeEvent
    );

    this.midiEventsByTick.set(currentTick, eventsForTick);
  }

  hasRecording = () => {
    const size = this.midiEventsByTick?.size;
    return size ? size > 0 : false;
  };

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
        if (clearUndesiredChordCallbacksForThisSequence?.size) {
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
