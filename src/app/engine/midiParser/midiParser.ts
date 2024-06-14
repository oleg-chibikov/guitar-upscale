import { AlertType } from "@/app/data/alertType";
import { NotePlayEvent } from "@/app/data/midiParser/notePlayEvent";
import { TrackData } from "@/app/data/midiParser/trackData";
import { OctaveNote, StringOctaveNote, getNoteText } from "@/app/data/notes";
import { getShiftedNote } from "@/app/data/tunings";
import { EventsByTick, NoteEvent } from "@/app/engine/eventsByTick";
import { extractChordFromNotes } from "@/app/engine/midiParser/chordMatcher";
import { groupEventsByTickWithTolerance } from "@/app/engine/midiParser/groupSplitter";
import { addIndividualNote } from "@/app/engine/midiParser/individualNoteMapper";
import { parseMidiFile } from "@/app/engine/midiParser/midiFileParser";
import { setCurrentScaleAndGroup } from "@/app/engine/scales/scaleLookupBuilder";
import { arrayToMap } from "@/app/helpers/arrayHelper";
import { FunctionCache } from "@/app/helpers/functionCache";
import {
  baseNoteValue,
  chordInstrumentValue,
  chordNotesToPlayValue,
  chordStrummingDelayMsValue,
} from "@/app/store/settingsSlice";
import { store } from "@/app/store/store";
import { setAndShowAlert } from "@/app/store/uiSlice";
import { read } from "midifile-ts";

// TODO: UI - restart. Maybe send to looper

// TODO: Match scale for Sliding Window rather than for the whole midi file. Can be useful when the song changes baseNote
const matchChordForToleranceGroupWithCache = new FunctionCache(
  extractChordFromNotes
);

export const parseMidiData = async (
  arrayBuffer: ArrayBuffer,
  setTempo: (bpm: number) => void
) => {
  const byteArray = new Uint8Array(arrayBuffer);
  const midiData = read(byteArray);
  console.log(midiData);
  const { dataByTrack, distinctNotes } = parseMidiFile(midiData, setTempo);
  const { scaleDetector } = await import("@/app/engine/scales/scaleDetector");

  scaleDetector.findMatches(
    distinctNotes,
    distinctNotes.filter((x) => x !== undefined).length,
    (result) => {
      const currentBaseNote = getShiftedNote(baseNoteValue);
      if (result.scales?.length) {
        const scalesInSameBaseNote = result.scales.filter(
          (x) => x.note === currentBaseNote
        );

        const firstMatchingScale = scalesInSameBaseNote.length
          ? scalesInSameBaseNote[0]
          : result.scales[0];
        setCurrentScaleAndGroup(firstMatchingScale, store.dispatch);
        store.dispatch(
          setAndShowAlert({
            message:
              "Playing the MIDI file in " +
              getNoteText(firstMatchingScale.note) +
              " " +
              firstMatchingScale.scale +
              " scale",
          })
        );
      } else {
        setCurrentScaleAndGroup(
          {
            group: "Special",
            scale: "Chromatic (All notes)",
            note: currentBaseNote,
          },
          store.dispatch
        );
        store.dispatch(
          setAndShowAlert({
            message:
              "Cannot detect scale for the MIDI file. Playing in the Chromatic scale",
            alertType: AlertType.Warning,
          })
        );
      }
    }
  );

  const eventsByTick = new EventsByTick();

  let trackIndex = 0;
  for (const track of dataByTrack) {
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

function compareOctaveNotesDescending(a: OctaveNote, b: OctaveNote) {
  if (a.octave === b.octave) {
    // If octaves are the same, sort by note in descending order
    return b.note - a.note;
  }
  // Otherwise, sort by octave in descending order
  return b.octave - a.octave;
}

function processToleranceGroup(
  toleranceGroup: NotePlayEvent[],
  eventsByTick: EventsByTick,
  toleranceWindowStart: number,
  trackIndex: number,
  previousNote: StringOctaveNote | undefined,
  instrument: string
) {
  const sortedNotes = toleranceGroup
    .map((x) => x.octaveNote)
    .sort(compareOctaveNotesDescending);

  const chordMatchResult =
    matchChordForToleranceGroupWithCache.execute(sortedNotes);

  let individualNotes = toleranceGroup;

  if (chordMatchResult !== undefined) {
    const { chordName, notes } = chordMatchResult;

    // within a toleranceGroup each octave note can occur only once (tolerance groups are built this way that if the note re-occurs - a new group is created).
    // therefore we can keep a 1 to 1 map of octave notes -> events
    const toleranceGroupMap = arrayToMap(toleranceGroup, (x) => x.octaveNote);
    // deleting the chord notes from the map - the rest should be individual notes
    for (const octaveNote of notes) {
      toleranceGroupMap.delete(octaveNote);
    }
    eventsByTick.addOrUpdateEvent(toleranceWindowStart, {
      chord: chordName,
      metadata: {
        trackNumber: trackIndex,
        notesToPlay: chordNotesToPlayValue,
        strummingDelayMs: chordStrummingDelayMsValue,
        trackInstrument: chordInstrumentValue,
      },
    });
    individualNotes = Array.from(toleranceGroupMap.values()).sort(
      (a, b) => a.tick - b.tick
    ); // all the notes excluding the chord, sorted
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
