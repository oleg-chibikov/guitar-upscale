import { TrackKey } from "@/app/data/trackKey";
import Midi from "midi-writer-js";
import type { NoteEvent } from "midi-writer-js/build/types/midi-events/note-event";
import { Instrument, getProgramForInstrument } from "../../data/instruments";
import { getNoteText } from "../../data/notes";
import {
  capoValue,
  scaleGroupValue,
  scaleValue,
  tempoBpmValue,
} from "../../store/settingsSlice";

const DRUM_CHANNEL = 10;
const CHANNEL_COUNT = 16;

// 1-based like midi-writer-js note events. Channel 10 plays drums in General MIDI, so tracks skip it
export const getTrackChannel = (trackIndex: number) => {
  const channel = (trackIndex % (CHANNEL_COUNT - 1)) + 1;
  return channel >= DRUM_CHANNEL ? channel + 1 : channel;
};

class MidiSaver {
  generateAndSave(midiEvents: Map<TrackKey, NoteEvent[]>) {
    const midiData = this.generateMidiData(midiEvents);
    this.downloadMidiFile(midiData);
  }

  getFileName(extension?: string) {
    return `Guitar upscale | ${scaleGroupValue} - ${scaleValue} | {${tempoBpmValue} BPM} | ${getNoteText(
      capoValue,
    )} | ${this.getFormattedDateTime()}.${extension ?? "mid"}`;
  }

  getMidiFile(midiEvents: Map<string, NoteEvent[]>) {
    const blob = this.generateMidiData(midiEvents);
    return new File([blob], this.getFileName("wav"), { type: "audio/wav" });
  }

  private downloadMidiFile(midiFile: Blob) {
    // Download MIDI file
    const url = URL.createObjectURL(midiFile);
    const link = document.createElement("a");
    link.href = url;
    link.download = this.getFileName();
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
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

  private generateMidiData(midiEvents: Map<string, NoteEvent[]>): Blob {
    const tracks = Array.from(midiEvents).map(([trackKey, notes], index) => {
      const track = new Midi.Track();
      const { instrument } = this.reverseTrackKey(trackKey);
      const channel = getTrackChannel(index);

      // the program change counts channels from 0, the note events from 1
      track.addEvent(
        new Midi.ProgramChangeEvent({
          instrument: getProgramForInstrument(instrument),
          channel: channel - 1,
        }),
      );
      track.setTempo(tempoBpmValue);
      track.addInstrumentName(instrument);
      track.addTrackName(instrument);
      track.addEvent(notes, () => ({ channel }));
      return track;
    });

    // Create a new MIDI file with the track
    const write = new Midi.Writer(tracks);
    const byteArray = write.buildFile() as Uint8Array<ArrayBuffer>;
    return new Blob([byteArray], { type: "audio/midi" });
  }
}

export const midiSaver = new MidiSaver();
