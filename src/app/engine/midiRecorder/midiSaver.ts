import { TrackKey } from "@/app/data/trackKey";
import Midi from "midi-writer-js";
import { NoteEvent } from "midi-writer-js/build/types/midi-events/note-event";
import { Instrument } from "../../data/instruments";
import { getNoteText } from "../../data/notes";
import {
  capoValue,
  scaleGroupValue,
  scaleValue,
  tempoBpmValue,
} from "../../store/settingsSlice";

class MidiSaver {
  generateAndSave(midiEvents: Map<TrackKey, NoteEvent[]>) {
    const midiData = this.generateMidiData(midiEvents);
    this.downloadMidiFile(midiData);
  }

  private downloadMidiFile(midiFile: Blob) {
    // Download MIDI file
    const url = URL.createObjectURL(midiFile);
    const link = document.createElement("a");
    link.href = url;
    link.download = `Guitar upscale | ${scaleGroupValue} - ${scaleValue} | {${tempoBpmValue} BPM} | ${getNoteText(
      capoValue
    )} | ${this.getFormattedDateTime()}.mid`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
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

  private reverseTrackKey(key: TrackKey) {
    const [instrument, trackNumber] = key.split("|");
    return {
      instrument: instrument as Instrument,
      trackNumber: Number(trackNumber),
    };
  }
}

export const midiSaver = new MidiSaver();
