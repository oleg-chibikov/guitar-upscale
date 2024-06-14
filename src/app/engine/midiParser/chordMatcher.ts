import {
  OctaveNote,
  StringOctaveNote,
  serializeOctaveNote,
} from "@/app/data/notes";
import {
  MIN_NOTES_TO_DETECT_CHORD,
  chordDetector,
} from "@/app/engine/chords/chordDetector";
import {
  STRING_COUNT,
  octaveNoteToStringOctaveNoteMap,
} from "@/app/engine/generateNeckRepresentation";

type ChordMatchResult = {
  chordName: string;
  notes: StringOctaveNote[];
};

export function extractChordFromNotes(
  sortedNotes: OctaveNote[]
): ChordMatchResult | undefined {
  if (sortedNotes.length < MIN_NOTES_TO_DETECT_CHORD) {
    return undefined;
  }
  const variations = getPossibleNotesArrangementOnNeck(sortedNotes)
    .map((variation) => variation.filter((x) => x) as StringOctaveNote[])
    .sort(
      // sorting to put the variations with the highest number of notes first (it might give the better matching chord if different variations are matching different chords)
      (a: StringOctaveNote[], b: StringOctaveNote[]) => b.length - a.length
    );
  for (const variation of variations) {
    console.log(
      "Detecting chord for",

      variation.map((x) =>
        x ? x.string + "_" + x.fret : "no value for this string"
      )
    );
    let chordName: string | undefined = undefined;
    chordDetector.findMatches(variation, (data) => {
      if (data.chords?.length) {
        chordName = data.chords[0];
      }
    });
    if (chordName !== undefined) {
      return { chordName, notes: variation };
    }
  }
  return undefined;
}

function getPossibleNotesArrangementOnNeck(sortedNotes: OctaveNote[]) {
  // TODO: this function is similar to getPossibleNotes in chordsGenerator, but still slightly different. Can we merge them somehow?

  const appendNextNoteRecursive = (
    indexOfNoteEvent: number,
    stringToPutNextNote: number,
    array: (StringOctaveNote | null)[]
  ): (StringOctaveNote | null)[][] => {
    if (stringToPutNextNote >= STRING_COUNT) {
      console.log(
        "Index of note event: %d, index of string to put current event: %d. Strings exceeded. Returning the result without further processing",
        indexOfNoteEvent,
        stringToPutNextNote
      );
      return [array];
    }
    const noteEvent = sortedNotes[indexOfNoteEvent];
    const serializedOctaveNote = serializeOctaveNote(noteEvent);
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
    const possibleBranches: (StringOctaveNote | null)[][] = [];
    while (highestNote.string <= stringToPutNextNote) {
      // if we already have a note on the string of highest note then add a new recursive branch
      const arrayCopy =
        highestNote.string < stringToPutNextNote ? [...array] : array; // reuse original array for the last iteration
      arrayCopy[highestNote.string] = highestNote;
      if (indexOfNoteEvent === sortedNotes.length - 1) {
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
