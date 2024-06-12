import { NotePlayEvent } from "@/app/data/midiParser/notePlayEvent";
import { StringOctaveNote, serializeOctaveNote } from "@/app/data/notes";
import {
  MIN_NOTES_TO_DETECT_CHORD,
  mainDetector,
} from "@/app/engine/chords/chordDetector";
import {
  STRING_COUNT,
  octaveNoteToStringOctaveNoteMap,
} from "@/app/engine/generateNeckRepresentation";
import { arrayToMap } from "@/app/helpers/arrayHelper";

type ChordMatchResult = { chord?: string; individualNotes: NotePlayEvent[] };

type MatchedChordData = {
  stringOctaveNote: StringOctaveNote;
  noteEvent: NotePlayEvent;
};

function compareOctaveNotesDescending(a: NotePlayEvent, b: NotePlayEvent) {
  if (a.octaveNote.octave === b.octaveNote.octave) {
    // If octaves are the same, sort by note in descending order
    return b.octaveNote.note - a.octaveNote.note;
  }
  // Otherwise, sort by octave in descending order
  return b.octaveNote.octave - a.octaveNote.octave;
}

export function matchChordForToleranceGroup(
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
