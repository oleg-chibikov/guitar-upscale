import { AlertType } from "@/app/data/alertType";
import { DistinctNoteMarker } from "@/app/data/midiParser/distinctNoteMarker";
import { NotePlayEvent } from "@/app/data/midiParser/notePlayEvent";
import { TrackData } from "@/app/data/midiParser/trackData";
import {
  OctaveNote,
  StringOctaveNote,
  getNoteText,
  serializeOctaveNote,
} from "@/app/data/notes";
import { CHROMATIC, SPECIAL } from "@/app/data/scales";
import { getShiftedNote } from "@/app/data/tunings";
import { setPromiseToResolveWhenChordsAreLoaded } from "@/app/engine/chords/chordsGeneratorWorkerApi";
import { EventsByTick, NoteEvent } from "@/app/engine/eventsByTick";
import { extractChordFromNotes } from "@/app/engine/midiParser/chordMatcher";
import { groupEventsByTickWithTolerance } from "@/app/engine/midiParser/groupSplitter";
import { addIndividualNote } from "@/app/engine/midiParser/individualNoteMapper";
import { parseMidiFile } from "@/app/engine/midiParser/midiFileParser";
import { setCurrentScaleAndGroup } from "@/app/engine/scales/scaleLookupBuilder";
import { arrayToMap } from "@/app/helpers/arrayHelper";
import { FunctionCache } from "@/app/helpers/functionCache";
import { createPromise } from "@/app/helpers/promiseHelper";
import {
  capoValue,
  chordInstrumentValue,
  chordNotesToPlayValue,
  chordStrummingDelayMsValue,
  setChordsAreLoading,
  tuningValue,
} from "@/app/store/settingsSlice";
import { store } from "@/app/store/store";
import { setAndShowAlert } from "@/app/store/uiSlice";
import { read } from "midifile-ts";

// TODO: UI - restart playback. Maybe send to looper

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

  await detectScale(distinctNotes);

  const eventsByTick = new EventsByTick();

  let trackIndex = 0;
  for (const track of dataByTrack) {
    await processTrack(track, eventsByTick, trackIndex);
    trackIndex++;
  }

  return eventsByTick;
};

async function detectScale(distinctNotes: DistinctNoteMarker[]) {
  const { scaleDetector } = await import("@/app/engine/scales/scaleDetector");
  return new Promise<void>((resolve) => {
    scaleDetector.findMatches(
      distinctNotes,
      distinctNotes.filter((x) => x !== undefined).length,
      async (result) => {
        let guitarSettingsChanged = false;
        const currentBaseNote = getShiftedNote(capoValue, tuningValue);
        if (result.scales !== undefined && result.scales.length > 0) {
          const scalesInSameBaseNote = result.scales.filter(
            (x) => x.note === currentBaseNote
          );

          const firstMatchingScale = scalesInSameBaseNote.length
            ? scalesInSameBaseNote[0]
            : result.scales[0];
          guitarSettingsChanged = setCurrentScaleAndGroup(
            firstMatchingScale,
            store.dispatch
          );
          store.dispatch(
            setAndShowAlert({
              message:
                "Playing the MIDI file in " +
                getNoteText(firstMatchingScale.note) +
                " " +
                firstMatchingScale.scale +
                " scale",
              alertType: AlertType.Success,
            })
          );
        } else {
          guitarSettingsChanged = setCurrentScaleAndGroup(
            {
              group: SPECIAL,
              scale: CHROMATIC,
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

        if (guitarSettingsChanged) {
          // settings changed - need to wait for the chords to be rebuilt
          console.log("Waiting for chords to load");

          //Create promise and pass resolve function to chord detector. Then wait for this promise to resolve
          const { waitFor, recreate } = createPromise();

          setPromiseToResolveWhenChordsAreLoaded(() => {
            recreate(true); // true means we don't need to create another one when this is resolved
          }); // set waiting to true soi tha waitForChordsToLoad doesn't return straight away
          store.dispatch(setChordsAreLoading(true));
          waitFor()
            .then(() => {
              console.log("Finished loading chords");
              resolve();
            })
            .catch((e) => {
              console.error("Cannot await midi parser wait", e);
              resolve();
            });
        } else {
          console.log(
            "Guitar settings didn't change - start playing immediately"
          );
          resolve();
        }
      }
    );
  });
}

async function processTrack(
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
    previousNote = await processToleranceGroup(
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

async function processToleranceGroup(
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

  const chordMatchResult = await matchChordForToleranceGroupWithCache.execute(
    sortedNotes
  );

  let individualNotes: NotePlayEvent[];

  if (chordMatchResult === undefined) {
    individualNotes = toleranceGroup;
  } else {
    const { chordName, notes } = chordMatchResult;

    // within a toleranceGroup each octave note can occur only once (tolerance groups are built this way that if the note re-occurs - a new group is created).
    // therefore we can keep a 1 to 1 map of octave notes -> events
    const toleranceGroupMap = arrayToMap(toleranceGroup, (x) =>
      serializeOctaveNote(x.octaveNote)
    );
    // deleting the chord notes from the map - the rest should be individual notes
    for (const octaveNote of notes) {
      toleranceGroupMap.delete(serializeOctaveNote(octaveNote));
    }
    eventsByTick.addEventAtTick(toleranceWindowStart, {
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
      eventsByTick.addEventAtTick(event.tick, noteEvent);
      previousNote = stringOctaveNote;
    }
  }
  return previousNote;
}
