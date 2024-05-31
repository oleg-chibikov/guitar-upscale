import { Instrument } from "@/app/data/instruments";
import { ChordOrNote, NoteEvent } from "@/app/data/looperData";
import {
  Note,
  OctaveNote,
  StringOctaveNote,
  serializeOctaveNote,
} from "@/app/data/notes";
import { mainDetector } from "@/app/engine/chordDetector";
import {
  NOTE_COUNT,
  octaveNoteToStringOctaveNoteMap,
} from "@/app/engine/generateNeckRepresentation";
import { TICKS_IN_BEAT, TICKS_IN_HALF_BEAT } from "@/app/engine/mainClock";
import {
  chordInstrumentValue,
  chordNotesToPlayValue,
  chordStrummingDelayMsValue,
} from "@/app/store/settingsSlice";
import {
  ChannelEvent,
  Event,
  InstrumentNameEvent,
  MetaEvent,
  MidiFile,
  NoteOffEvent,
  NoteOnEvent,
} from "midifile-ts";

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
// TODO: detect scale and set it. Use trie similar to chords.
// TODO: If a tick inside the track has more than 3 notes - detect chord.
// TODO: Enable chord detector while playing (or add the setting)
// TODO: UI - play, next note prev note. pause. restart. Maybe send to looper
// TODO: How to distribute notes on the neck? we need to check the previous note and put the next note on the string above

const TOLERANCE_TICKS = TICKS_IN_HALF_BEAT; // we assume a chord consists of notes that are close to each other within half beat

type NotePlayEvent = {
  tick: number;
  octaveNote: OctaveNote;
  duration: number;
  velocity: number;
};

function compareOctaveNotes(a: NotePlayEvent, b: NotePlayEvent) {
  if (a.octaveNote.octave === b.octaveNote.octave) {
    // If octaves are the same, sort by note
    return a.octaveNote.note - b.octaveNote.note;
  }
  // Otherwise, sort by octave
  return a.octaveNote.octave - b.octaveNote.octave;
}

export const parseMidiData = async (midiData: MidiFile) => {
  console.log(midiData);
  const trackDataArray = parseMidiFile(midiData);
  // TODO: First, determine and set the scale and base note. Once it's set wait for neck to update.
  // then continue with assigning notes to strings

  const eventsByTick = new Map<number, ChordOrNote[]>();

  let trackIndex = 0;
  for (const track of trackDataArray) {
    const groupedByTolerance = groupEventsByTickWithTolerance(
      track.events,
      TOLERANCE_TICKS
    );

    let previousNote: StringOctaveNote | undefined;
    for (const [toleranceWindowStart, toleranceGroup] of Array.from(
      groupedByTolerance.entries()
    )) {
      // Try matching a chord out of matched notes.
      // If matched - play it as a chord. Play notMatchedNotes individually
      // If not matched - play all the notes in groupedByTolerance individually
      const { chord, individualNotes } =
        matchChordForToleranceGroup(toleranceGroup);

      if (chord !== undefined) {
        if (!eventsByTick.has(toleranceWindowStart)) {
          eventsByTick.set(toleranceWindowStart, []);
        }
        eventsByTick.get(toleranceWindowStart)?.push({
          chord: {
            chord,
            metadata: {
              trackNumber: trackIndex,
              notesToPlay: chordNotesToPlayValue,
              strummingDelayMs: chordStrummingDelayMsValue,
              trackInstrument: chordInstrumentValue,
            },
          },
        });
      }

      for (const event of individualNotes) {
        const { octaveNote } = event;
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
          const stringOctaveNote = chooseBestPosition(
            possibleStringOctaveNotes,
            previousNote
          );
          previousNote = stringOctaveNote;
          const noteEvent: NoteEvent = {
            note: stringOctaveNote,
            trackNumber: trackIndex,
            velocity: event.velocity || 127,
            instrument: track.instrument ?? "acoustic_guitar_nylon",
          };
          if (!eventsByTick.has(event.tick)) {
            eventsByTick.set(event.tick, []);
          }
          eventsByTick.get(event.tick)?.push({ note: noteEvent });
        }
      }
    }

    trackIndex++;
  }

  return eventsByTick;
};

type ChordMatchResult = { chord?: string; individualNotes: NotePlayEvent[] };

function matchChordForToleranceGroup(
  toleranceGroup: NotePlayEvent[]
): ChordMatchResult {
  const { matchedNotes, notMatchedNotes } =
    getChordNotesFromToleranceGroup(toleranceGroup);
  if (matchedNotes.length) {
    const chordDetector = mainDetector.clone(false); // TODO: await import
    for (const stringOctaveNote of matchedNotes) {
      chordDetector.addNoteToDetector({ stringOctaveNote });
    }
    // TODO: Check why it doesn't find matches
    const matchedChords = chordDetector.findMatches();
    if (matchedChords?.length) {
      return { chord: matchedChords[0], individualNotes: notMatchedNotes };
    }
  }
  return { individualNotes: toleranceGroup };
}

function getChordNotesFromToleranceGroup(toleranceGroup: NotePlayEvent[]) {
  const matchedNotes: StringOctaveNote[] = [];
  const notMatchedNotes: NotePlayEvent[] = [];
  const sortedByNote = toleranceGroup.sort(compareOctaveNotes);
  let lastString: number | undefined;
  for (const noteOfPossibleChordToCheck of sortedByNote) {
    const serializedOctaveNote = serializeOctaveNote(
      noteOfPossibleChordToCheck.octaveNote
    );
    const possibleStringOctaveNotes =
      octaveNoteToStringOctaveNoteMap.get(serializedOctaveNote); // these notes should be already sorted from lowest to highest string
    if (!possibleStringOctaveNotes) {
      continue; // no note in the current scale
    }

    let firstMatchingNote: StringOctaveNote | undefined;

    for (const stringOctaveNote of possibleStringOctaveNotes) {
      if (lastString !== undefined && stringOctaveNote.string >= lastString) {
        continue; // skip all the strings that are lower or equal to the string of last note from the chord
      }
      firstMatchingNote = stringOctaveNote;
      break;
    }
    if (!firstMatchingNote) {
      notMatchedNotes.push(noteOfPossibleChordToCheck);
      continue; // all strings exhausted
    }
    matchedNotes.push(firstMatchingNote);
    lastString = firstMatchingNote.string;
  }

  return { matchedNotes, notMatchedNotes };
}

function groupEventsByTickWithTolerance(
  events: NotePlayEvent[],
  tolerance: number
): Map<number, NotePlayEvent[]> {
  // Assume events are already sorted
  const groupedEventsMap: Map<number, NotePlayEvent[]> = new Map();
  let currentGroup: NotePlayEvent[] = [];
  let toleranceWindowStart: number | null = null;

  for (let i = 0; i < events.length; i++) {
    const currentEvent = events[i];

    if (toleranceWindowStart === null) {
      // If tolerance window is not set, set it to the current event's tick
      toleranceWindowStart = currentEvent.tick;
    }

    if (currentEvent.tick - toleranceWindowStart <= tolerance) {
      // If the event falls within the tolerance window, add it to the current group
      currentGroup.push(currentEvent);
    } else {
      // If the event is outside the tolerance window, add the current group to the map
      if (toleranceWindowStart !== null) {
        groupedEventsMap.set(toleranceWindowStart, currentGroup);
      }
      // Start a new group with the current event
      currentGroup = [currentEvent];
      // Reset tolerance window start
      toleranceWindowStart = currentEvent.tick;
    }
  }

  // Add the last group to the map
  if (currentGroup.length > 0 && toleranceWindowStart !== null) {
    groupedEventsMap.set(toleranceWindowStart, currentGroup);
  }

  return groupedEventsMap;
}

function chooseBestPosition(
  positions: StringOctaveNote[],
  previousPosition: StringOctaveNote | undefined
): StringOctaveNote {
  if (!previousPosition) {
    // No previous position, choose the lowest fret
    return positions.reduce(
      (best, pos) => (pos.fret < best.fret ? pos : best),
      positions[0]
    );
  }

  // Minimize hand movement by choosing the closest position
  return positions.reduce((best, pos) => {
    const bestDistance =
      Math.abs(best.string - previousPosition.string) +
      Math.abs(best.fret - previousPosition.fret);
    const posDistance =
      Math.abs(pos.string - previousPosition.string) +
      Math.abs(pos.fret - previousPosition.fret);
    return posDistance < bestDistance ? pos : best;
  }, positions[0]);
}

type TrackData = { instrument?: Instrument; events: NotePlayEvent[] };

function parseMidiFile(midiData: MidiFile) {
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
                  const note = ((NOTE_COUNT + noteNumber - 4) %
                    NOTE_COUNT) as Note;

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
          }
          break;
      }
    });
    dataByTrack.push(data);
  });

  return dataByTrack;
}
