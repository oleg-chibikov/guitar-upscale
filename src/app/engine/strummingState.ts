import { toggleInterval } from "../store/settingsSlice";

export let currentChord: string | undefined;

export const setCurrentChord = (chordName: string) => {
  currentChord = chordName;
};

type PromiseAndResolve = {
  promise: Promise<void>;
  resolve: (value: void | PromiseLike<void>) => void;
};

export let strummingChordsMap = new Map<
  string,
  PromiseAndResolve | undefined
>();

const createStrummingPromise = (): PromiseAndResolve => {
  let resolve: ((value: void | PromiseLike<void>) => void) | undefined;
  const promise = new Promise<void>((r) => {
    resolve = r;
  });

  return {
    promise,
    resolve: resolve as (value: void | PromiseLike<void>) => void,
  };
};

export const isThisChordStrumming = (chordName: string): boolean =>
  strummingChordsMap.has(chordName);

export const areOtherChordsStrumming = (chordName: string): boolean =>
  Array.from(strummingChordsMap).filter((x) => x[0] !== chordName).length > 0;

export const getOtherStrummingChordPromises = (
  chordName: string
): Promise<void>[] => {
  const promises = Array.from(strummingChordsMap)
    .map(([name, promiseAndResolve]) => {
      if (name !== chordName) {
        return promiseAndResolve?.promise; // There are other chords strumming
      }
    })
    .filter((x) => x) as Promise<void>[];
  return promises;
};

// After calling this method strumming is allowed to continue for one more tick/beat (depends on the settings).
// It is needed to allow switching between chords immediately after the pattern is finished to repeat it instead of starting afresh
// Strumming is totally finished for the chord when setIsStrumming is called with the false value
export const markStrummingAsPendingFinishing = (chordName: string) => {
  console.log("---> Strumming ending. Grace period started", chordName);
  const promiseAndResolve = strummingChordsMap.get(chordName);
  promiseAndResolve?.resolve();
  strummingChordsMap.set(chordName, undefined);
};

export const setIsStrumming = (chordName: string, value: boolean) => {
  if (value) {
    console.log("---> Strumming pending");
    strummingChordsMap.set(chordName, createStrummingPromise());
  } else {
    const promiseAndResolve = strummingChordsMap.get(chordName);
    promiseAndResolve?.resolve();
    strummingChordsMap.delete(chordName);
    console.log("---> Strumming grace period ended", chordName);
  }
  toggleInterval(value);
};
