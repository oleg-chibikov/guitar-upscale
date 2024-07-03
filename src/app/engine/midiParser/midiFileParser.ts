import { TICKS_IN_BEAT } from "@/app/data/clockConstants";
import { DistinctNoteMarker } from "@/app/data/midiParser/distinctNoteMarker";
import { TrackData } from "@/app/data/midiParser/trackData";
import { NOTE_COUNT, Note, OctaveNote, initNotesArray } from "@/app/data/notes";
import { microsecondsToBpm } from "@/app/helpers/clockHelper";
import {
  ChannelEvent,
  Event,
  InstrumentNameEvent,
  MetaEvent,
  MidiFile,
  NoteOffEvent,
  NoteOnEvent,
  SetTempoEvent,
} from "midifile-ts";

export function parseMidiFile(
  midiData: MidiFile,
  setTempo: (bpm: number) => void
) {
  console.log("Parsing midi file");
  const dataByTrack: TrackData[] = [];
  const distinctNotes = initNotesArray<DistinctNoteMarker>();
  const getGuitarUpscaleTicks = (midiTicks: number) =>
    (midiTicks / midiData.header.ticksPerBeat) * TICKS_IN_BEAT;
  midiData.header.ticksPerBeat;
  midiData.tracks.forEach((track) => {
    let currentPosition = 0;
    const data: TrackData = { events: [] };

    const noteOnMap: Map<number, number> = new Map<number, number>(); // noteNumber to currentPosition

    track.forEach((event: Event<string>) => {
      currentPosition += event.deltaTime; // each new event is relative to the previous one
      const convertedPosition = getGuitarUpscaleTicks(currentPosition);

      switch (event.type) {
        case "channel": {
          const channelEvent = event as ChannelEvent<string>;

          switch (channelEvent.subtype) {
            case "noteOn": {
              const noteOnEvent = event as NoteOnEvent;
              noteOnMap.set(noteOnEvent.noteNumber, convertedPosition);
              break;
            }
            case "noteOff":
              {
                const noteOffEvent = event as NoteOffEvent;
                const matchedNoteOnPosition = noteOnMap.get(
                  noteOffEvent.noteNumber
                );
                if (matchedNoteOnPosition === undefined) {
                  console.error("No matching NoteOn event for", noteOffEvent);
                } else {
                  const noteNumber = noteOffEvent.noteNumber;
                  const octave = Math.floor(noteNumber / NOTE_COUNT);
                  const note = ((NOTE_COUNT + noteNumber) % NOTE_COUNT) as Note;

                  const octaveNote: OctaveNote = {
                    note,
                    octave,
                  };
                  data.events.push({
                    tick: matchedNoteOnPosition,
                    octaveNote,
                    duration: convertedPosition - matchedNoteOnPosition,
                    velocity: noteOffEvent.velocity,
                  });
                  distinctNotes[octaveNote.note] = 1;
                }
              }
              break;
          }
          break;
        }
        case "meta": {
          const metaEvent = event as MetaEvent<string>;
          switch (metaEvent.subtype) {
            case "instrumentName":
              {
                const instrumentEvent = event as InstrumentNameEvent;
                data.instrument = instrumentEvent.text;
              }
              break;
            case "setTempo": {
              const setTempoEvent = event as SetTempoEvent;
              const newBpm = microsecondsToBpm(
                setTempoEvent.microsecondsPerBeat
              );
              setTempo(newBpm);
              break;
            }
          }
          break;
        }
      }
    });
    dataByTrack.push(data);
  });

  return { dataByTrack, distinctNotes };
}
