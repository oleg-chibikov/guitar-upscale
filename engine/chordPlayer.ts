import { Chord } from "../data/notes";
import { NoteChordMode, getClosestVariation } from "./chordsGenerator";
import { NotePlayEventBus } from "./eventBus";
import { sleep } from "./sleep";

// TODO add type instead of having all params separately
const chordRoundRobinMap = new Map<string, number>();

const selectRandomVariation = (variations: Chord[]) => {
  const randomIndex = Math.floor(Math.random() * variations.length);
  return variations[randomIndex];
};

const playVariation = async (
  variation: Chord,
  variationKey: string,
  chord: string,
  delayMs?: number,
  notesToPlay?: number
) => {
  let i = 0;
  console.log(`Playing ${variationKey} variation of ${chord}`);
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

export const playRandomChordVariation = async (
  chord: string,
  mode: NoteChordMode,
  delayMs?: number,
  notesToPlay?: number
) => {
  const randomVariation = selectRandomVariation(mode.variations);
  await playVariation(randomVariation, "random", chord, delayMs, notesToPlay);
};

export const playFirstChordVariation = async (
  chord: string,
  mode: NoteChordMode,
  delayMs?: number,
  notesToPlay?: number
) => {
  const randomVariation = mode.variations[0];
  await playVariation(randomVariation, "first", chord, delayMs, notesToPlay);
};

export const playClosestChordVariation = async (
  chord: string,
  mode: NoteChordMode,
  delayMs?: number,
  notesToPlay?: number
) => {
  const closestVariation = getClosestVariation(mode);
  if (closestVariation) {
    await playVariation(
      closestVariation,
      "closest",
      chord,
      delayMs,
      notesToPlay
    );
  }
};

export const playAllVariations = async (
  chord: string,
  mode: NoteChordMode,
  delayMs?: number,
  notesToPlay?: number
) => {
  for (const variation of mode.variations) {
    await playVariation(variation, "combined", chord, delayMs, notesToPlay);
    await sleep(1000);
  }
};

export const playRoundRobin = async (
  chord: string,
  mode: NoteChordMode,
  delayMs?: number,
  notesToPlay?: number
) => {
  let currentVariation = chordRoundRobinMap.get(chord);
  if (currentVariation === undefined) {
    currentVariation = 0;
  } else {
    currentVariation++;
    if (currentVariation >= mode.variations.length) {
      currentVariation = 0;
    }
  }
  await playVariation(
    mode.variations[currentVariation],
    "round robin",
    chord,
    delayMs,
    notesToPlay
  );
  chordRoundRobinMap.set(chord, currentVariation);
};
