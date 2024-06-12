import { NotePlayEvent } from "@/app/data/midiParser/notePlayEvent";
import { TrackData } from "@/app/data/midiParser/trackData";
import { StringOctaveNote } from "@/app/data/notes";
import { EventsByTick, NoteEvent } from "@/app/engine/eventsByTick";
import { matchChordForToleranceGroup } from "@/app/engine/midiParser/chordMatcher";
import { groupEventsByTickWithTolerance } from "@/app/engine/midiParser/groupSplitter";
import { addIndividualNote } from "@/app/engine/midiParser/individualNoteMapper";
import { parseMidiFile } from "@/app/engine/midiParser/midiFileParser";
import {
  chordInstrumentValue,
  chordNotesToPlayValue,
  chordStrummingDelayMsValue,
} from "@/app/store/settingsSlice";
import { MidiFile } from "midifile-ts";

//TODO: Set tempo:

// TODO: detect scale and set it. Use trie similar to chords.
// TODO: Enable chord detector while playing (or add the setting)
// TODO: UI - play, next note prev note. pause. restart. Maybe send to looper
// TODO: How to distribute notes on the neck? we need to check the previous note and put the next note on the string above

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
    processTrack(track, eventsByTick, trackIndex);

    trackIndex++;
  }

  return eventsByTick;
};
function processTrack(
  track: TrackData,
  eventsByTick: EventsByTick,
  trackIndex: number
) {
  const groupedByTolerance = groupEventsByTickWithTolerance(track.events);
  const instrument = track.instrument ?? "acoustic_guitar_nylon";

  let previousNote: StringOctaveNote | undefined;
  for (const [toleranceWindowStart, toleranceGroup] of Array.from(
    groupedByTolerance.entries()
  )) {
    // Try matching a chord out of matched notes.
    // If matched - play it as a chord. Play notMatchedNotes individually
    // If not matched - play all the notes in groupedByTolerance individually
    previousNote = processToleranceGroup(
      toleranceGroup,
      eventsByTick,
      toleranceWindowStart,
      trackIndex,
      previousNote,
      instrument
    );
  }
}

function processToleranceGroup(
  toleranceGroup: NotePlayEvent[],
  eventsByTick: EventsByTick,
  toleranceWindowStart: number,
  trackIndex: number,
  previousNote: StringOctaveNote | undefined,
  instrument: string
) {
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
    const stringOctaveNote = addIndividualNote(event, previousNote);

    if (stringOctaveNote) {
      const noteEvent: NoteEvent = {
        note: stringOctaveNote,
        trackNumber: trackIndex,
        velocity: event.velocity || 127,
        instrument,
      };
      eventsByTick.addOrUpdateEvent(event.tick, noteEvent);
      previousNote = stringOctaveNote;
    }
  }
  return previousNote;
}
