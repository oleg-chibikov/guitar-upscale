import Midi from "midi-writer-js";
import { NoteEvent } from "midi-writer-js/build/types/midi-events/note-event";
import { Instrument } from "../data/instruments";
import { MAX_VELOCITY, OctaveNote, getNoteText } from "../data/notes";
import { NOTE_COUNT } from "./generateNeckRepresentation";

// Define a class for MIDI recorder
export class MidiRecorder {
  private midiEvents: Map<string, NoteEvent[]> | undefined;
  private isRecording: boolean = false;
  private startTime: number | undefined;
  private noteShift = 4; // Shift from the programs 0 note (E) to midi-writer-js zero nopte which is C
  private octaveShift = 0;
  private msInTick = 4; // Assuming each tick is 4 ms at 120BPM - no math here. It just produces very similar timings.

  startRecording() {
    this.midiEvents = new Map<string, NoteEvent[]>();
    this.isRecording = true;
  }

  stopRecording(save: boolean) {
    this.isRecording = false;
    if (save && this.midiEvents) {
      const midiData = this.generateMidiData(this.midiEvents);
      this.downloadMidiFile(midiData);
    }
    this.midiEvents = undefined;
    this.startTime = undefined;
  }

  convertMillisecondsToTicks(
    milliseconds: number,
    tickDuration: number
  ): number {
    return Math.round(milliseconds / tickDuration);
  }

  addNoteToMidiTrack(
    note: OctaveNote,
    trackNumber: number,
    instrument: Instrument
  ) {
    if (this.isRecording) {
      const currentTime = performance.now();
      if (this.startTime === undefined) {
        this.startTime = currentTime; // start recording from the first actual note, not from the Record button hit
      }
      const deltaTime = currentTime - this.startTime;
      const playAtTick = this.convertMillisecondsToTicks(
        deltaTime,
        this.msInTick
      );
      console.log(
        `Recording ${getNoteText(note.note)}${
          note.octave
        }; delta: ${playAtTick} ticks (${deltaTime} ms)`
      );
      if (!this.midiEvents) {
        return;
      }

      const trackKey = instrument + "|" + trackNumber;

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
          duration: "4",
          channel: 1,
          sequential: false,
          tick: playAtTick,
        })
      );
    }
  }

  private generateMidiData(midiEvents: Map<string, NoteEvent[]>): Blob {
    const tracks = Array.from(midiEvents).map(([trackKey, notes]) => {
      // Create a track with MIDI events
      const track = new Midi.Track();
      // Define an instrument (optional):
      const parts = trackKey.split("|");
      const instrument = parts[0] as Instrument;
      const trackNumber = parseInt(parts[1]);
      track.addEvent(new Midi.ProgramChangeEvent({ instrument: trackNumber }));
      track.setTempo(120);
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

  private downloadMidiFile(midiFile: Blob) {
    // Download MIDI file
    const url = URL.createObjectURL(midiFile);
    const link = document.createElement("a");
    link.href = url;
    link.download = `Guitar upscale ${this.getFormattedDateTime()}.mid`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }
}

export const midiRecorder = new MidiRecorder();
