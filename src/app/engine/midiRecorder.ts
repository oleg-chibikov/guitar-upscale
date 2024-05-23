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
import { NOTE_COUNT } from "./generateNeckRepresentation";
import {
  TICKS_IN_BEAT,
  globalCurrentLastBarTick,
  globalCurrentTick,
} from "./mainClock";

type TrackKey = string;

export enum NoteOrigin {
  Separate,
  FromStrumming,
  FromSingle,
}

export class MidiRecorder {
  private midiEvents: Map<TrackKey, NoteEvent[]> | undefined;
  private isRecording: boolean = false;
  private startTick: number | undefined;
  private noteShift = 4; // Shift from the program's 0 note (E) to midi-writer-js zero note which is C
  private octaveShift = 0;
  private TICK_SHIFT = 16; // Gap till next bar as starting from 0 for some reason gives corrupted melody

  startRecording() {
    this.midiEvents = new Map<TrackKey, NoteEvent[]>();
    this.isRecording = true;
    this.startTick = undefined;
  }

  stopRecording(save: boolean) {
    this.isRecording = false;
    if (save && this.midiEvents?.size) {
      const midiData = this.generateMidiData(this.midiEvents);
      this.downloadMidiFile(midiData);
    }
    this.midiEvents = undefined;
    this.startTick = undefined;
  }

  convertMillisecondsToTicks(
    milliseconds: number,
    tickDuration: number
  ): number {
    return Math.round(milliseconds / tickDuration);
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
