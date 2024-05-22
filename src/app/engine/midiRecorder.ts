import Midi from "midi-writer-js";
import { NoteEvent } from "midi-writer-js/build/types/midi-events/note-event";
import { Instrument } from "../data/instruments";
import { MAX_VELOCITY, StringOctaveNote, getNoteText } from "../data/notes";
import {
  baseNoteValue,
  scaleGroupValue,
  scaleValue,
  tempoBpmValue,
} from "../store/settingsSlice";
import { NotePlayEventBus } from "./eventBus";
import { NOTE_COUNT } from "./generateNeckRepresentation";
import {
  TICKS_IN_BAR,
  TICKS_IN_BEAT,
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
type TrackKey = string;

// Define a class for MIDI recorder
export class MidiRecorder {
  private midiEvents: Map<TrackKey, NoteEvent[]> | undefined;
  private midiEventsByTick: Map<number, InternalNoteEvent[]> | undefined;
  private isRecording: boolean = false;
  private startTick: number | undefined;
  private lastBarTickWhenStoppedRecording: number | undefined;
  private noteShift = 4; // Shift from the program's 0 note (E) to midi-writer-js zero note which is C
  private octaveShift = 0;
  private TICK_SHIFT = 16; // Gap till next bar as starting from 0 for some reason gives corrupted melody
  private abortController = new AbortController();

  startRecording() {
    this.midiEvents = new Map<TrackKey, NoteEvent[]>();
    this.midiEventsByTick = new Map<number, InternalNoteEvent[]>();
    this.isRecording = true;
    this.startTick = undefined;
    this.lastBarTickWhenStoppedRecording = undefined;
  }

  stopRecording(save: boolean) {
    this.isRecording = false;
    if (save && this.midiEvents?.size) {
      const midiData = this.generateMidiData(this.midiEvents);
      this.downloadMidiFile(midiData);
    }
    this.midiEvents = undefined;
    this.midiEventsByTick = undefined;
    this.startTick = undefined;
  }

  stopRecordingWithoutClearing() {
    this.isRecording = false;
    this.lastBarTickWhenStoppedRecording = globalCurrentLastBarTick;
  }

  convertMillisecondsToTicks(
    milliseconds: number,
    tickDuration: number
  ): number {
    return Math.round(milliseconds / tickDuration);
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

    if (!eventsAtTick?.length) {
      return;
    }

    console.log(
      "Playing notes [%s] at tick %d",
      eventsAtTick
        .map((x) => getNoteText(x.note.note) + x.note.octave)
        .join(","),
      tick
    );

    eventsAtTick.forEach(({ note, trackNumber, instrument }) => {
      NotePlayEventBus.next({
        stringOctaveNote: note,
        fromChord: false,
        fromLooper: true,
        trackInstrument: instrument,
        trackNumber,
      });
    });
  }

  addNoteToMidiTrack(
    note: StringOctaveNote,
    trackNumber: number,
    instrument: Instrument,
    useLastBarAsStartTick: boolean
  ) {
    if (this.isRecording) {
      const currentTick = globalCurrentTick;
      if (this.startTick === undefined) {
        this.startTick = useLastBarAsStartTick
          ? globalCurrentLastBarTick
          : currentTick; // start recording from the first actual note (or from the last bar if instructed like that), not from the Record button hit
      }
      const playAtTick = currentTick - this.startTick;
      console.log(
        `Recording ${getNoteText(note.note)}${
          note.octave
        }; delta: ${playAtTick} ticks`
      );
      if (!this.midiEvents) {
        return;
      }
      if (this.midiEventsByTick) {
        const internalNoteEvent = {
          tick: currentTick,
          note,
          trackNumber,
          instrument,
        };
        let eventsForTick = this.midiEventsByTick.get(currentTick);
        if (!eventsForTick) {
          eventsForTick = [internalNoteEvent];
        } else {
          eventsForTick.push(internalNoteEvent);
        }
        this.midiEventsByTick.set(currentTick, eventsForTick);
      }

      const trackKey = this.getTrackKey(trackNumber, instrument);

      let noteEventsForTrack = this.midiEvents.get(trackKey);

      if (!noteEventsForTrack) {
        noteEventsForTrack = [];

        this.midiEvents.set(trackKey, noteEventsForTrack);
      }

      noteEventsForTrack.push(
        new Midi.NoteEvent({
          pitch: [
            note.note +
              this.noteShift +
              (this.octaveShift + note.octave) * NOTE_COUNT,
          ],
          velocity: MAX_VELOCITY,
          duration: "8", // the bigger the value - the shorter the note
          channel: 1,
          sequential: false,
          tick: (playAtTick + this.TICK_SHIFT) * (128 / TICKS_IN_BEAT), // ticks in the program are not the same as ticks in midi-writer-js, so we need to adjust them
        })
      );
    }
  }

  hasRecording = () => {
    const size = this.midiEventsByTick?.size;
    return size ? size > 0 : false;
  };

  private async waitForTick(
    tickToWaitFor: number,
    currentTick: number,
    abortSignal: AbortSignal
  ) {
    const ticksToWait = tickToWaitFor - currentTick;
    // console.log(
    //   "We are at tick %d, need to wait for tick %d. Ticks to wait: %d",
    //   currentTick,
    //   tickToWaitFor,
    //   ticksToWait
    // );

    // const barsToWait = Math.floor(ticksToWait / TICKS_IN_BAR);
    // ticksToWait %= TICKS_IN_BAR;

    // const halfBarsToWait = Math.floor(ticksToWait / TICKS_IN_HALF_BAR);
    // ticksToWait %= TICKS_IN_HALF_BAR;

    // const beatsToWait = Math.floor(ticksToWait / TICKS_IN_BEAT);
    // ticksToWait %= TICKS_IN_BEAT;

    // const halfBeatsToWait = Math.floor(ticksToWait / TICKS_IN_HALF_BEAT);
    // ticksToWait %= TICKS_IN_HALF_BEAT;

    // for (let i = 0; i < barsToWait; i++) {
    //   if (this.stopMarker) {
    //     return;
    //   }
    //   await waitForNextBar();
    // }

    // for (let i = 0; i < halfBarsToWait; i++) {
    //   if (this.stopMarker) {
    //     return;
    //   }
    //   await waitForNextHalfBar();
    // }

    // for (let i = 0; i < beatsToWait; i++) {
    //   if (this.stopMarker) {
    //     return;
    //   }
    //   await waitForNextBeat();
    // }

    // for (let i = 0; i < halfBeatsToWait; i++) {
    //   if (this.stopMarker) {
    //     return;
    //   }
    //   await waitForNextHalfBeat();
    // }

    for (let i = 0; i < ticksToWait; i++) {
      if (abortSignal.aborted) {
        return Promise.resolve();
      }
      await waitForNextTick();
    }
  }

  private generateMidiData(midiEvents: Map<string, NoteEvent[]>): Blob {
    const tracks = Array.from(midiEvents).map(([trackKey, notes]) => {
      // Create a track with MIDI events
      const track = new Midi.Track();
      // Define an instrument (optional):
      const { instrument, trackNumber } = this.reverseTrackKey(trackKey);

      track.addEvent(new Midi.ProgramChangeEvent({ instrument: trackNumber }));
      track.setTempo(tempoBpmValue);
      track.addInstrumentName(instrument);
      track.addTrackName(instrument);
      track.addEvent(notes);
      return track;
    });

    // Create a new MIDI file with the track
    const write = new Midi.Writer(tracks);
    const byteArray = write.buildFile();
    return new Blob([byteArray], { type: "audio/midi" });
  }

  private getFormattedDateTime() {
    const currentDate = new Date();
    const year = currentDate.getFullYear();
    const month = String(currentDate.getMonth() + 1).padStart(2, "0"); // Adding 1 because months are zero-based
    const day = String(currentDate.getDate()).padStart(2, "0");
    const hours = String(currentDate.getHours()).padStart(2, "0");
    const minutes = String(currentDate.getMinutes()).padStart(2, "0");

    return `${year}-${month}-${day} ${hours}-${minutes}`;
  }

  private getTrackKey(trackNumber: number, instrument: Instrument): TrackKey {
    return instrument + "|" + trackNumber;
  }

  private reverseTrackKey(key: TrackKey) {
    const [instrument, trackNumber] = key.split("|");
    return {
      instrument: instrument as Instrument,
      trackNumber: Number(trackNumber),
    };
  }

  private downloadMidiFile(midiFile: Blob) {
    // Download MIDI file
    const url = URL.createObjectURL(midiFile);
    const link = document.createElement("a");
    link.href = url;
    link.download = `Guitar upscale | ${scaleGroupValue} - ${scaleValue} | {${tempoBpmValue} BPM} | ${getNoteText(
      baseNoteValue
    )} | ${this.getFormattedDateTime()}.mid`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }
}

export const midiRecorder = new MidiRecorder();
