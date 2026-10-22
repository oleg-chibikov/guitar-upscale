import { TICKS_IN_BEAT } from "@/app/data/clockConstants";
import { TrackKey } from "@/app/data/trackKey";
import { MAX_VOLUME } from "@/app/data/volume";
import { chordPreferredVariationsByName } from "@/app/engine/chords/chordNotesByName";
import {
  ChordWithPlayMetadata,
  DEFAULT_CHORD_TRACK_NUMBER,
} from "@/app/engine/eventBus";
import { EventsByTick } from "@/app/engine/eventsByTick";
import { midiSaver } from "@/app/engine/midiRecorder/midiSaver";
import { NoteRecorder } from "@/app/engine/midiRecorder/noteRecorder";
import Midi from "midi-writer-js";
import type { NoteEvent } from "midi-writer-js/build/types/midi-events/note-event";
import { Instrument } from "../../data/instruments";
import { NOTE_COUNT, StringOctaveNote, getNoteText } from "../../data/notes";
import { globalCurrentTick } from "../clock/mainClock";

export enum NoteOrigin {
  Separate,
  FromStrumming,
  FromSingle,
}

export class MidiRecorder implements NoteRecorder {
  private midiEvents: Map<TrackKey, NoteEvent[]> | undefined;
  private eventsByTick: EventsByTick | undefined;
  private isRecording: boolean = false;
  private startTick: number | undefined;
  private octaveShift = 0;
  private TICK_SHIFT = 16; // Gap till next bar as starting from 0 for some reason gives corrupted melody

  startRecording() {
    this.midiEvents = new Map<TrackKey, NoteEvent[]>();
    this.eventsByTick = new EventsByTick();
    this.isRecording = true;
    this.startTick = undefined;
  }

  getMidiFile() {
    if (this.midiEvents && this.midiEvents?.size) {
      return midiSaver.getMidiFile(this.midiEvents);
    }
  }

  stopRecording(save: boolean): EventsByTick | undefined {
    const eventsByTick = this.eventsByTick;
    this.isRecording = false;
    if (save && this.midiEvents && this.midiEvents?.size) {
      midiSaver.generateAndSave(this.midiEvents);
    }
    this.midiEvents = undefined;
    this.eventsByTick = undefined;
    this.startTick = undefined;
    return eventsByTick;
  }

  addNoteAtGlobalTick(
    note: StringOctaveNote,
    trackNumber: number,
    instrument: Instrument
  ) {
    if (!this.isRecording || !this.midiEvents || !this.eventsByTick) {
      return;
    }

    const playAtTick = this.getRelativeTick();
    this.addNoteAtTick(note, trackNumber, instrument, playAtTick);
    this.eventsByTick.addEventAtTick(playAtTick, {
      note,
      trackNumber,
      instrument,
    });
  }

  addChordAtGlobalTick(chord: ChordWithPlayMetadata) {
    if (!this.isRecording || !this.eventsByTick) {
      return;
    }

    const playAtTick = this.getRelativeTick();
    this.eventsByTick.addEventAtTick(playAtTick, chord);
  }

  initializeStartTick(startTick: number) {
    this.startTick = startTick;
  }

  addEvents(eventsByTick: EventsByTick) {
    for (const eventsAtTick of eventsByTick.items) {
      for (const event of eventsAtTick.events) {
        const note = event.note;
        const chord = event.chord;
        if (note) {
          this.addNoteAtTick(
            note.note,
            note.looperChannel ?? note.trackNumber,
            note.instrument ?? "acoustic_guitar_nylon",
            eventsAtTick.tick
          );
        }
        if (chord) {
          const preferredVariations = chordPreferredVariationsByName.get(
            chord.chord
          );
          if (preferredVariations) {
            for (const chordNote of preferredVariations.variation) {
              if (!chordNote) {
                continue;
              }
              this.addNoteAtTick(
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

  private addNoteAtTick(
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

  private getRelativeTick() {
    const currentTick = globalCurrentTick;
    if (this.startTick === undefined) {
      this.startTick = currentTick; // start recording from the first actual note (or from the last bar if instructed like that), not from the Record button hit
    }

    const playAtTick = currentTick - this.startTick;
    return playAtTick;
  }

  private getTrackKey(trackNumber: number, instrument: Instrument): TrackKey {
    return `${instrument}|${trackNumber}`;
  }
}

export const midiRecorder = new MidiRecorder();
