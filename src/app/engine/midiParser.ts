import { Instrument } from "@/app/data/instruments";
import { NoteEvent } from "@/app/data/looperData";
import { Note, OctaveNote, serializeOctaveNote } from "@/app/data/notes";
import {
  NOTE_COUNT,
  octaveNoteToStringOctaveNoteMap,
} from "@/app/engine/generateNeckRepresentation";
import { TICKS_IN_BEAT } from "@/app/engine/mainClock";
import {
  ChannelEvent,
  Event,
  InstrumentNameEvent,
  MetaEvent,
  MidiFile,
  NoteOffEvent,
  NoteOnEvent,
} from "midifile-ts";

export const parseMidiData = async (midiData: MidiFile) => {
  const eventsByTick: Map<number, NoteEvent[]> = new Map<number, NoteEvent[]>();
  console.log(midiData);
  const getGuitarUpscaleTicks = (midiTicks: number) =>
    (midiTicks / midiData.header.ticksPerBeat) * TICKS_IN_BEAT;
  midiData.header.ticksPerBeat;
  midiData.tracks.forEach((track: any, trackIndex: number) => {
    let currentPosition = 0;
    let instrument: Instrument;
    //TODO: Set tempo:
    /*deltaTime
: 
0
microsecondsPerBeat
: 
555556
subtype
: 
"setTempo"
type
: 
"meta"*/
    const noteOnMap: Map<number, number> = new Map<number, number>(); // noteNumber to currentPosition

    // TODO: detect scale and set it. Use trie similar to chords.
    // TODO: If a tick inside the track has more than 3 notes - detect chord.
    // TODO: Enable chord detector while playing (or add the setting)
    // TODO: UI - play, next note prev note. pause. restart. Maybe send to looper
    // TODO: How to distribute notes on the neck? we need to check the previous note and put the next note on the string above
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
                  let octave = Math.floor(noteNumber / NOTE_COUNT);
                  const note = (noteNumber % NOTE_COUNT) as Note;
                  if (note >= Note.C) {
                    octave++;
                  }
                  const octaveNote: OctaveNote = {
                    note,
                    octave,
                  };
                  const serializedOctaveNote = serializeOctaveNote(octaveNote);
                  const possibleStringOctaveNotes =
                    octaveNoteToStringOctaveNoteMap.get(serializedOctaveNote);
                  if (
                    possibleStringOctaveNotes === undefined ||
                    possibleStringOctaveNotes.length === 0
                  ) {
                    console.error(
                      "note %s is not in the scale. Skipping it",
                      serializedOctaveNote
                    );
                  } else {
                    const stringOctaveNote = possibleStringOctaveNotes[0];
                    const noteEvent: NoteEvent = {
                      note: stringOctaveNote,
                      trackNumber: trackIndex,
                      velocity: noteOffEvent.velocity || 127,
                      instrument: instrument,
                    };
                    if (!eventsByTick.has(matchedNoteOnPosition)) {
                      eventsByTick.set(matchedNoteOnPosition, []);
                    }
                    eventsByTick.get(matchedNoteOnPosition)?.push(noteEvent);
                  }
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
                instrument = instrumentEvent.text;
              }
              break;
          }
          break;
      }
    });
  });

  return eventsByTick;
};
