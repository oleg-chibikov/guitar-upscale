import { NoteChordMode } from "@/app/data/chordModes";
import { getClosestVariation } from "@/app/engine/chords/chordsGenerator";
import { Chord } from "../../data/notes";
import { sleep } from "../../helpers/sleep";
import { chordNotesToPlayValue } from "../../store/settingsSlice";
import { ChordMetadata, NotePlayEventBus } from "../eventBus";

export type ChordPlayParameters = ChordMetadata & {
  chordName: string;
  noteChordMode: NoteChordMode;
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
  const closestVariation = getClosestVariation(params.noteChordMode.variations);
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
