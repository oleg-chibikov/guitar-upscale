import Midi from "midi-writer-js";
import { NoteEvent } from "midi-writer-js/build/types/midi-events/note-event";
import { Platform } from "react-native";
import { OctaveNote, getNoteText } from "../data/notes";
import { NoteCount } from "./generateNeckRepresentation";

// Define a class for MIDI recorder
class MidiRecorder {
  private midiEvents: NoteEvent[] = [];
  private isRecording: boolean = false;
  private startTime: number | undefined;
  private noteShift = 4; // Shift from the programs 0 note (E) to midi-writer-js zero nopte which is C
  private octaveShift = 0;
  private msInTick = 4; // Assuming each tick is 4 ms at 120BPM - no math here. It just produces very similar timings.

  startRecording() {
    this.midiEvents = [];
    this.isRecording = true;
  }

  stopRecording(save: boolean) {
    this.isRecording = false;
    if (save) {
      const midiData = this.generateMidiData();
      this.downloadMidiFile(midiData);
    }
    this.midiEvents = [];
    this.startTime = undefined;
  }

  convertMillisecondsToTicks(
    milliseconds: number,
    tickDuration: number
  ): number {
    return Math.round(milliseconds / tickDuration);
  }

  addNoteToMidiTrack(note: OctaveNote) {
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
      this.midiEvents.push(
        new Midi.NoteEvent({
          pitch: [
            note.note +
              this.noteShift +
              (this.octaveShift + note.octave) * NoteCount,
          ],
          velocity: 125,
          duration: "4",
          channel: 1,
          sequential: false,
          tick: playAtTick,
        })
      );
    }
  }

  private generateMidiData(): Blob {
    // Create a track with MIDI events
    const track = new Midi.Track();
    track.setTempo(120);
    track.addInstrumentName("Acoustic guitar");
    track.addTrackName("Acoustic guitar");
    track.addEvent(this.midiEvents);

    // Create a new MIDI file with the track
    const write = new Midi.Writer([track]);
    const byteArray = write.buildFile();
    return new Blob([byteArray], { type: "audio/midi" });
  }

  private downloadMidiFile(midiFile: Blob) {
    if (Platform.OS === "web") {
      // Download MIDI file
      const url = URL.createObjectURL(midiFile);
      const link = document.createElement("a");
      link.href = url;
      link.download = "Guitar upscale.mid";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } else {
      // TODO: implement for native
    }
  }
}

export const midiRecorder = new MidiRecorder();
