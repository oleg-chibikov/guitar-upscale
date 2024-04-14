import { Chord } from "../data/notes";
import { NoteChordMode, getClosestVariation } from "./chordsGenerator";
import { NotePlayEventBus } from "./eventBus";
import { sleep } from "./sleep";

export type ChordPlayParameters = {
  chordName: string;
  noteChordMode: NoteChordMode;
  delayMs?: number;
  notesToPlay?: number;
};

const chordRoundRobinMap = new Map<string, number>();

const selectRandomVariation = (variations: Chord[]) => {
  const randomIndex = Math.floor(Math.random() * variations.length);
  return variations[randomIndex];
};

const playVariation = async (
  variation: Chord,
  variationKey: string,
  { chordName, delayMs, notesToPlay }: ChordPlayParameters
) => {
  let i = 0;
  console.log(`Playing ${variationKey} variation of ${chordName}`);
  for (const note of variation) {
    NotePlayEventBus.next({ note, metadata: { fromChord: true } });
    if (notesToPlay && ++i >= notesToPlay) {
      break;
    }
    if (delayMs) {
      await sleep(delayMs);
    }
  }
};

export const playRandomChordVariation = async (params: ChordPlayParameters) => {
  const randomVariation = selectRandomVariation(
    params.noteChordMode.variations
  );
  await playVariation(randomVariation, "random", params);
};

export const playFirstChordVariation = async (params: ChordPlayParameters) => {
  const randomVariation = params.noteChordMode.variations[0];
  await playVariation(randomVariation, "first", params);
};

export const playClosestChordVariation = async (
  params: ChordPlayParameters
) => {
  const closestVariation = getClosestVariation(params.noteChordMode);
  if (closestVariation) {
    await playVariation(closestVariation, "closest", params);
  }
};

export const playAllVariations = async (params: ChordPlayParameters) => {
  for (const variation of params.noteChordMode.variations) {
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
    if (currentVariation >= params.noteChordMode.variations.length) {
      currentVariation = 0;
    }
  }
  await playVariation(
    params.noteChordMode.variations[currentVariation],
    "round robin",
    params
  );
  chordRoundRobinMap.set(params.chordName, currentVariation);
};
