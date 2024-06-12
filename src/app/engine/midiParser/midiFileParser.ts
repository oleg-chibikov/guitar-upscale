import { TrackData } from "@/app/data/midiParser/trackData";
import { Note, OctaveNote } from "@/app/data/notes";
import { NOTE_COUNT } from "@/app/engine/generateNeckRepresentation";
import { TICKS_IN_BEAT, microsecondsToBpm } from "@/app/engine/mainClock";
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
  const getGuitarUpscaleTicks = (midiTicks: number) =>
    (midiTicks / midiData.header.ticksPerBeat) * TICKS_IN_BEAT;
  midiData.header.ticksPerBeat;
  midiData.tracks.forEach((track: any, trackIndex: number) => {
    let currentPosition = 0;
    const data: TrackData = { events: [] };

    const noteOnMap: Map<number, number> = new Map<number, number>(); // noteNumber to currentPosition

    track.forEach((event: Event<string>) => {
      currentPosition += event.deltaTime; // each new event is relative to the previous one
      const convertedPosition = getGuitarUpscaleTicks(currentPosition);

      switch (event.type) {
        case "channel":
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
                }
              }
              break;
          }
          break;
        case "meta":
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
    });
    dataByTrack.push(data);
  });

  return dataByTrack;
}
