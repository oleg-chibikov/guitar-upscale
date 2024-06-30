import {} from "@/app/data/chordModes";
import { chordsGenerator } from "@/app/engine/chords/chordsGenerator";
import { Chord } from "../../data/notes";
import { sleep } from "../../helpers/sleep";
import { chordNotesToPlayValue } from "../../store/settingsSlice";
import { ChordMetadata, NotePlayEventBus } from "../eventBus";

export type ChordPlayParameters = ChordMetadata & {
  chordName: string;
  variations: Chord[];
  delayMs?: number;
  notesToPlay?: number;
  reverse: boolean;
};

const chordRoundRobinMap = new Map<string, number>();

const selectRandomVariation = (variations: Chord[]) => {
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
  const toPlay = reverse ? [...variation].reverse() : variation;
  for (const note of toPlay) {
    if (!note) {
      continue;
    }
    NotePlayEventBus.next({
      ...rest, // track metadata and strumming metadata
      stringOctaveNote: note,
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
  const preferredVariations = chordsGenerator.chordNotesByName.get(
    params.chordName
  );
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
  const preferredVariations = chordsGenerator.chordNotesByName.get(
    params.chordName
  );
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
  const preferredVariations = chordsGenerator.chordNotesByName.get(
    params.chordName
  );
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
