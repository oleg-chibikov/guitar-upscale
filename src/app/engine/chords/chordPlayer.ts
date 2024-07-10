import { ChordVariations } from "@/app/data/chordModes";
import { chordNotesByName } from "@/app/engine/chords/chordNotesByName";
import { Chord, Note, StringOctaveNote } from "../../data/notes";
import { sleep } from "../../helpers/sleep";
import {
  capoValue,
  chordNotesToPlayValue,
  neckValue,
  slashChordBassNoteValue,
} from "../../store/settingsSlice";
import { ChordMetadata, NotePlayEventBus } from "../eventBus";

export type ChordPlayParameters = ChordMetadata & {
  chordName: string;
  variations: ChordVariations;
  delayMs?: number;
  notesToPlay?: number;
  reverse: boolean;
};

const chordRoundRobinMap = new Map<string, number>();

export const playRandomChordVariation = async (params: ChordPlayParameters) => {
  if (!params.variations.length) {
    return;
  }
  const randomVariation = selectRandomVariation(params.variations);
  await playVariation(randomVariation, "random", params);
};

export const playFirstChordVariation = async (params: ChordPlayParameters) => {
  if (!params.variations.length) {
    return;
  }
  const variation = params.variations[0];
  await playVariation(variation, "first", params);
};

export const playPreferredChordVariation = async (
  params: ChordPlayParameters
) => {
  if (!params.variations.length) {
    return;
  }
  const preferredVariations = chordNotesByName.get(params.chordName);
  if (preferredVariations) {
    await playVariation(preferredVariations.preferred, "preferred", params);
  }
};

export const playPreferredChordVariationWithMinimumNotes = async (
  params: ChordPlayParameters
) => {
  if (!params.variations.length) {
    return;
  }
  const preferredVariations = chordNotesByName.get(params.chordName);
  if (preferredVariations) {
    await playVariation(
      preferredVariations.preferredWithMinNotes,
      "preferred min notes",
      params
    );
  }
};

export const playPreferredChordVariationWithMaximumNotes = async (
  params: ChordPlayParameters
) => {
  if (!params.variations.length) {
    return;
  }
  const preferredVariations = chordNotesByName.get(params.chordName);
  if (preferredVariations) {
    await playVariation(
      preferredVariations.preferredWithMaxNotes,
      "preferred max notes",
      params
    );
  }
};

export const playAllVariations = async (params: ChordPlayParameters) => {
  for (const variation of params.variations) {
    await playVariation(variation, "combined", params);
    await sleep(1000);
  }
};

export const playRoundRobin = async (params: ChordPlayParameters) => {
  let currentVariation = chordRoundRobinMap.get(params.chordName);
  if (currentVariation === undefined) {
    currentVariation = 0;
  } else {
    currentVariation++;
    if (currentVariation >= params.variations.length) {
      currentVariation = 0;
    }
  }
  await playVariation(
    params.variations[currentVariation],
    "round robin",
    params
  );
  chordRoundRobinMap.set(params.chordName, currentVariation);
};

const selectRandomVariation = (variations: ChordVariations) => {
  const randomIndex = Math.floor(Math.random() * variations.length);
  return variations[randomIndex];
};

const playVariation = async (
  variation: Chord,
  variationKey: string,
  { chordName, delayMs, notesToPlay, reverse, ...rest }: ChordPlayParameters
) => {
  const noteCount = notesToPlay ?? chordNotesToPlayValue;
  let i = 0;
  console.log(`Playing ${variationKey} variation of ${chordName}`);
  const variationNotes = variation.filter((x) => x) as StringOctaveNote[];
  replaceBassNoteWithSlash(variationNotes);
  const toPlay = reverse ? variationNotes.reverse() : variationNotes;
  for (const stringOctaveNote of toPlay) {
    NotePlayEventBus.next({
      ...rest, // track metadata and strumming metadata
      stringOctaveNote,
      fromChord: true,
    });
    if (++i >= noteCount) {
      break;
    }
    if (delayMs !== undefined && delayMs > 0) {
      await sleep(delayMs);
    }
  }
};

// it goes simultaneously to the right and left from the source note and stops when the targetNote is found
const findClosestNote = (
  stringNotes: (StringOctaveNote | null)[],
  sourceNote: StringOctaveNote,
  targetNote: Note
): StringOctaveNote | null => {
  const sourceIndex = stringNotes.findIndex(
    (note) =>
      note && note.string === sourceNote.string && note.fret === sourceNote.fret
  );

  if (sourceIndex === -1) return null;

  let leftIndex = sourceIndex;
  let rightIndex = sourceIndex;

  while (leftIndex >= 0 || rightIndex < stringNotes.length) {
    // Check left
    if (leftIndex >= 0) {
      const leftNote = stringNotes[leftIndex];
      if (leftNote && leftNote.note === targetNote) {
        return leftNote;
      }
      leftIndex--;
    }

    // Check right
    if (rightIndex < stringNotes.length) {
      const rightNote = stringNotes[rightIndex];
      if (rightNote && rightNote.note === targetNote) {
        return rightNote;
      }
      rightIndex++;
    }
  }

  return null;
};

const replaceBassNoteWithSlash = (variationNotes: StringOctaveNote[]) => {
  const bassNote = variationNotes[variationNotes.length - 1];
  const slashNote = slashChordBassNoteValue;
  if (slashNote !== undefined && neckValue) {
    let closestSlashBassNote: StringOctaveNote | null = null;
    let minDistance = Infinity;

    // Search on the current string and lower strings
    for (
      let stringIndex = bassNote.string;
      stringIndex < neckValue.length;
      stringIndex++
    ) {
      const stringNotes = neckValue[stringIndex];

      // Check for "open" string (at capo position) first
      const capoNote = stringNotes[capoValue];
      if (
        stringIndex > bassNote.string &&
        capoNote &&
        capoNote.note === slashNote
      ) {
        closestSlashBassNote = {
          ...capoNote,
          string: stringIndex,
          fret: capoValue,
        };
        break; // Prefer "open" string (at capo position) on lower strings
      }

      const slashBassNote = findClosestNote(
        stringNotes,
        { ...bassNote, string: stringIndex },
        slashNote
      );

      if (slashBassNote) {
        const distance = Math.abs(slashBassNote.fret - bassNote.fret);
        if (distance < minDistance) {
          minDistance = distance;
          closestSlashBassNote = { ...slashBassNote, string: stringIndex };
        }
      }
    }

    if (closestSlashBassNote) {
      // Remove the original bass note
      variationNotes.pop();

      // Add the new slash bass note
      variationNotes.push(closestSlashBassNote);
    }
  }
};
