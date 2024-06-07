import { Instrument } from "@/app/data/instruments";
import {
  Note,
  OctaveNote,
  StringOctaveNote,
  serializeOctaveNote,
} from "@/app/data/notes";
import {
  MIN_NOTES_TO_DETECT_CHORD,
  mainDetector,
} from "@/app/engine/chords/chordDetector";
import { EventsByTick, NoteEvent } from "@/app/engine/eventsByTick";
import {
  NOTE_COUNT,
  STRING_COUNT,
  octaveNoteToStringOctaveNoteMap,
} from "@/app/engine/generateNeckRepresentation";
import {
  TICKS_IN_BEAT,
  TICKS_IN_HALF_BEAT,
  microsecondsToBpm,
} from "@/app/engine/mainClock";
import { arrayToMap } from "@/app/helpers/arrayHelper";
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
  SetTempoEvent,
} from "midifile-ts";

//TODO: Set tempo:

// TODO: detect scale and set it. Use trie similar to chords.
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

function compareOctaveNotesDescending(a: NotePlayEvent, b: NotePlayEvent) {
  if (a.octaveNote.octave === b.octaveNote.octave) {
    // If octaves are the same, sort by note in descending order
    return b.octaveNote.note - a.octaveNote.note;
  }
  // Otherwise, sort by octave in descending order
  return b.octaveNote.octave - a.octaveNote.octave;
}

export const parseMidiData = async (
  midiData: MidiFile,
  setTempo: (bpm: number) => void
) => {
  console.log(midiData);
  const trackDataArray = parseMidiFile(midiData, setTempo);
  // TODO: First, determine and set the scale and base note. Once it's set wait for neck to update.
  // then continue with assigning notes to strings

  const eventsByTick = new EventsByTick();

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
        eventsByTick.addOrUpdateEvent(toleranceWindowStart, {
          chord,
          metadata: {
            trackNumber: trackIndex,
            notesToPlay: chordNotesToPlayValue,
            strummingDelayMs: chordStrummingDelayMsValue,
            trackInstrument: chordInstrumentValue,
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
          eventsByTick.addOrUpdateEvent(event.tick, noteEvent);
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
  if (toleranceGroup.length < MIN_NOTES_TO_DETECT_CHORD) {
    return { individualNotes: toleranceGroup };
  }
  const variations = getChordNotesFromToleranceGroup(toleranceGroup)
    .map((variation) => variation.filter((x) => x) as MatchedChordData[])
    .sort(
      // sorting to put the variations with the highest number of notes first (it might give the better matching chord if different variations are matching different chords)
      (a: MatchedChordData[], b: MatchedChordData[]) => b.length - a.length
    );
  for (const variation of variations) {
    console.log(
      "Detecting chord for",

      variation.map((x) =>
        x
          ? x.stringOctaveNote.string + "_" + x.stringOctaveNote.fret
          : "no value for this string"
      )
    );
    const chordDetector = mainDetector.clone(false); // TODO: await import
    for (const data of variation) {
      chordDetector.addNoteToDetector({
        stringOctaveNote: data.stringOctaveNote,
      });
    }
    const matchedChords = chordDetector.findMatches();
    if (matchedChords?.length) {
      // Taking the first value as they are already sorted

      const toleranceGroupMap = arrayToMap(toleranceGroup, (x) => x);
      // deleting the chord notes from the map - the rest should be individual notes
      for (const data of variation) {
        toleranceGroupMap.delete(data.noteEvent);
      }
      const individualNotes = Array.from(toleranceGroupMap.values());
      return { chord: matchedChords[0], individualNotes };
    }
  }
  return { individualNotes: toleranceGroup };
}

type MatchedChordData = {
  stringOctaveNote: StringOctaveNote;
  noteEvent: NotePlayEvent;
};

function getChordNotesFromToleranceGroup(toleranceGroup: NotePlayEvent[]) {
  const sortedByNote = toleranceGroup.sort(compareOctaveNotesDescending);
  // TODO: this function is similar to getPossibleNotes in chordsGenerator, but still slightly different. Can we merge them somehow?

  const appendNextNoteRecursive = (
    indexOfNoteEvent: number,
    stringToPutNextNote: number,
    array: (MatchedChordData | null)[]
  ): (MatchedChordData | null)[][] => {
    if (stringToPutNextNote >= STRING_COUNT) {
      console.log(
        "Index of note event: %d, index of string to put current event: %d. Strings exceeded. Returning the result without further processing",
        indexOfNoteEvent,
        stringToPutNextNote
      );
      return [array];
    }
    const noteEvent = sortedByNote[indexOfNoteEvent];
    const serializedOctaveNote = serializeOctaveNote(noteEvent.octaveNote);
    const possibleStringOctaveNotes =
      octaveNoteToStringOctaveNoteMap.get(serializedOctaveNote); // these notes should be already sorted from lowest to highest string
    if (!possibleStringOctaveNotes?.length) {
      array[stringToPutNextNote] = null;
      console.log(
        "Index of note event: %d, index of string to put current event: %d. No matching notes in the current scale",
        indexOfNoteEvent,
        stringToPutNextNote
      );
      return appendNextNoteRecursive(
        indexOfNoteEvent + 1,
        stringToPutNextNote + 1,
        array
      );
    }

    let noteIndex = 1;
    const len = possibleStringOctaveNotes.length;
    let highestNote = possibleStringOctaveNotes[len - noteIndex];
    // take the first note that matches the intended string
    if (highestNote.string > stringToPutNextNote) {
      array[stringToPutNextNote] = null;
      console.log(
        "Index of note event: %d, index of string to put current event: %d. No matching notes for the current string. Trying the same note on the next string",
        indexOfNoteEvent,
        stringToPutNextNote
      );
      return appendNextNoteRecursive(
        indexOfNoteEvent,
        stringToPutNextNote + 1,
        array
      );
    }
    console.log(
      "Index of note event: %d, index of string to put current event: %d. Processing possible notes",
      indexOfNoteEvent,
      stringToPutNextNote
    );
    const possibleBranches: (MatchedChordData | null)[][] = [];
    while (highestNote.string <= stringToPutNextNote) {
      // if we already have a note on the string of highest note then add a new recursive branch
      const arrayCopy =
        highestNote.string < stringToPutNextNote ? [...array] : array; // reuse original array for the last iteration
      arrayCopy[highestNote.string] = {
        stringOctaveNote: highestNote,
        noteEvent,
      };
      if (indexOfNoteEvent === sortedByNote.length - 1) {
        // for the last note in the sequence add the array to result
        possibleBranches.push(arrayCopy);
      } else {
        const nextBranches = appendNextNoteRecursive(
          indexOfNoteEvent + 1,
          highestNote.string + 1,
          arrayCopy
        );
        for (const branch of nextBranches) {
          possibleBranches.push(branch);
        }
      }

      noteIndex++;
      if (noteIndex > len) {
        break;
      }
      highestNote = possibleStringOctaveNotes[len - noteIndex];
    }
    return possibleBranches;
  };

  return appendNextNoteRecursive(0, 0, []);
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

function parseMidiFile(midiData: MidiFile, setTempo: (bpm: number) => void) {
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
