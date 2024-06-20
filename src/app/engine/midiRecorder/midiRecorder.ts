import { TrackKey } from "@/app/data/trackKey";
import { MAX_VOLUME } from "@/app/data/volume";
import { TICKS_IN_BEAT } from "@/app/engine/clock/clockConstants";
import { NoteRecorder } from "@/app/engine/midiRecorder/noteRecorder";
import Midi from "midi-writer-js";
import { NoteEvent } from "midi-writer-js/build/types/midi-events/note-event";
import { Instrument } from "../../data/instruments";
import { StringOctaveNote, getNoteText } from "../../data/notes";
import { globalCurrentTick } from "../clock/mainClock";
import { NOTE_COUNT } from "../generateNeckRepresentation";

export enum NoteOrigin {
  Separate,
  FromStrumming,
  FromSingle,
}

export class MidiRecorder implements NoteRecorder {
  private midiEvents: Map<TrackKey, NoteEvent[]> | undefined;
  private isRecording: boolean = false;
  private startTick: number | undefined;
  private octaveShift = 0;
  private TICK_SHIFT = 16; // Gap till next bar as starting from 0 for some reason gives corrupted melody

  startRecording() {
    this.midiEvents = new Map<TrackKey, NoteEvent[]>();
    this.isRecording = true;
    this.startTick = undefined;
  }

  async stopRecording(save: boolean) {
    this.isRecording = false;
    if (save && this.midiEvents !== undefined && this.midiEvents.size) {
      const midiSaver = (await import("@/app/engine/midiRecorder/midiSaver"))
        .midiSaver;
      midiSaver.generateAndSave(this.midiEvents);
    }
    this.midiEvents = undefined;
    this.startTick = undefined;
  }

  addNoteAtGlobalTick(
    note: StringOctaveNote,
    trackNumber: number,
    instrument: Instrument
  ) {
    if (!this.isRecording || !this.midiEvents) {
      return;
    }

    const currentTick = globalCurrentTick;
    if (this.startTick === undefined) {
      this.startTick = currentTick; // start recording from the first actual note (or from the last bar if instructed like that), not from the Record button hit
    }

    const playAtTick = currentTick - this.startTick;
    this.addNoteAtTick(note, trackNumber, instrument, playAtTick);
  }

  initializeStartTick(startTick: number) {
    this.startTick = startTick;
  }

  addNoteAtTick(
    note: StringOctaveNote,
    trackNumber: number,
    instrument: Instrument,
    tick: number
  ) {
    if (!this.isRecording || !this.midiEvents) {
      return;
    }
    console.log(
      `Recording ${getNoteText(note.note)}${note.octave}; delta: ${tick} ticks`
    );

    const trackKey = this.getTrackKey(trackNumber, instrument);

    let noteEventsForTrack = this.midiEvents.get(trackKey);

    if (!noteEventsForTrack) {
      noteEventsForTrack = [];

      this.midiEvents.set(trackKey, noteEventsForTrack);
    }
    const midiOctave = note.octave;

    noteEventsForTrack.push(
      new Midi.NoteEvent({
        pitch: [note.note + (this.octaveShift + midiOctave) * NOTE_COUNT],
        volume: MAX_VOLUME,
        duration: "8", // the bigger the value - the shorter the note
        channel: 1,
        sequential: false,
        tick: (tick + this.TICK_SHIFT) * (128 / TICKS_IN_BEAT), // ticks in the program are not the same as ticks in midi-writer-js, so we need to adjust them
      })
    );
  }

  private getTrackKey(trackNumber: number, instrument: Instrument): TrackKey {
    return `${instrument}|${trackNumber}`;
  }
}

export const midiRecorder = new MidiRecorder();
