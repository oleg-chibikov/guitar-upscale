import {
  ChordBuilderInfo,
  ChordVariations,
  StringOctaveNoteWithFingerPosition,
} from "@/app/data/chordModes";
import { chordPreferredVariationsByName } from "@/app/engine/chords/chordNotesByName";
import { replaceBassNoteWithSlash } from "@/app/engine/chords/slashChordPlayer";
import { sleep } from "../../helpers/sleep";
import { chordNotesToPlayValue } from "../../store/settingsSlice";
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
  params: ChordPlayParameters,
) => {
  if (!params.variations.length) {
    return;
  }
  const preferredVariation = chordPreferredVariationsByName.get(
    params.chordName,
  );
  if (preferredVariation) {
    await playVariation(preferredVariation, "preferred", params);
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
    params,
  );
  chordRoundRobinMap.set(params.chordName, currentVariation);
};

const selectRandomVariation = (variations: ChordVariations) => {
  const randomIndex = Math.floor(Math.random() * variations.length);
  return variations[randomIndex];
};

const playVariation = async (
  variation: ChordBuilderInfo,
  variationKey: string,
  { chordName, delayMs, notesToPlay, reverse, ...rest }: ChordPlayParameters,
) => {
  const noteCount = notesToPlay ?? chordNotesToPlayValue;

  const combinedData = variation.variation.map((x, i) =>
    x === undefined
      ? undefined
      : ({
          stringOctaveNote: x,
          fingerIndex: variation.fingerAssignment[i],
        } as StringOctaveNoteWithFingerPosition),
  );
  console.log(`Playing ${variationKey} variation of ${chordName}`);

  const filtered = combinedData.filter(
    (x) => x !== undefined,
  ) as StringOctaveNoteWithFingerPosition[];

  replaceBassNoteWithSlash(filtered);

  const playSingleNote = async (
    noteWithFinger: StringOctaveNoteWithFingerPosition,
  ) => {
    NotePlayEventBus.next({
      ...rest, // track metadata and strumming metadata
      stringOctaveNote: noteWithFinger.stringOctaveNote,
      fromChord: true,
      chordFinger: noteWithFinger.fingerIndex,
    });

    if (delayMs !== undefined && delayMs > 0) {
      await sleep(delayMs);
    }
  };

  const maxNotes = Math.min(filtered.length, noteCount);

  if (reverse) {
    for (let i = maxNotes - 1; i >= 0; i--) {
      await playSingleNote(filtered[i]);
    }
  } else {
    for (let i = 0; i < maxNotes; i++) {
      await playSingleNote(filtered[i]);
    }
  }
};
