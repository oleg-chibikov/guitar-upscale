import { toggleInterval } from "../store/settingsSlice";

export let currentChord: string | undefined;

export const setCurrentChord = (chordName: string) => {
  currentChord = chordName;
};

export enum StrummingState {
  Clicked, // when chord button is being pressed for the first time
  PendingStrummingStart, // wait for the next interval/beat/other strumming to finish
  Strumming, // when the wait time is over and actual strumming starts
  GracePeriod, // one interval after strumming to allow switching between chords and keep playing
}

type PromiseAndResolve = {
  promise: Promise<void>;
  resolve: (value: void | PromiseLike<void>) => void;
};

type StrummingData = {
  isClicked: boolean;
  clickPromiseAndResolve?: PromiseAndResolve;
  state: StrummingState;
  promiseAndResolve?: PromiseAndResolve;
};

export let strummingChordsMap = new Map<string, StrummingData>();

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

export const isThisChordStrummingOrPendingStrumming = (
  chordName: string
): boolean =>
  strummingChordsMap.get(chordName)?.state !== StrummingState.Clicked;

export const areOtherChordsStrumming = (chordName: string): boolean =>
  Array.from(strummingChordsMap).filter((x) => x[0] !== chordName).length > 0;

export const getOtherStrummingChordPromises = (
  chordName: string
): Promise<void>[] => {
  const promises = Array.from(strummingChordsMap)
    .map(([name, data]) => {
      if (name !== chordName) {
        return data.promiseAndResolve?.promise; // There are other chords strumming
      }
    })
    .filter((x) => x) as Promise<void>[];
  return promises;
};

// After calling this method strumming is allowed to continue for one more tick/beat (depends on the settings).
// It is needed to allow switching between chords immediately after the pattern is finished to repeat it instead of starting afresh
// Strumming is totally finished for the chord when setIsStrumming is called with the false value
export const markChordAsPendingStrummingFinishing = (chordName: string) => {
  const { promiseAndResolve, isClicked } =
    strummingChordsMap.get(chordName) ??
    (() => {
      throw new Error("No record for strumming");
    })();

  if (!promiseAndResolve) {
    throw new Error("No record for strumming promise");
  }

  promiseAndResolve.resolve();
  strummingChordsMap.set(chordName, {
    state: StrummingState.GracePeriod,
    isClicked: isClicked,
  });
  console.log(
    "---> Strumming peniding finishing. Grace period started",
    chordName
  );
};

export const isChordClicked = (chordName: string) =>
  strummingChordsMap.get(chordName)?.isClicked === true;

export const getChordClickedPromise = (chordName: string) =>
  strummingChordsMap.get(chordName)?.clickPromiseAndResolve?.promise;

export const isChordPlaying = (chordName: string) =>
  strummingChordsMap.get(chordName)?.state === StrummingState.Strumming;

export const registerChordClick = (chordName: string) => {
  const data = strummingChordsMap.get(chordName);

  const clickPromiseAndResolve = createStrummingPromise();

  // might be clicked when already in another state
  strummingChordsMap.set(chordName, {
    state: data ? data.state : StrummingState.Clicked,
    promiseAndResolve: data?.promiseAndResolve,
    clickPromiseAndResolve: clickPromiseAndResolve,
    isClicked: true,
  });

  console.log("---> Strumming registered", chordName);
};

export const releaseChordClick = (chordName: string) => {
  const data = strummingChordsMap.get(chordName);

  if (!data) {
    return;
  }

  if (data.clickPromiseAndResolve) {
    data.clickPromiseAndResolve.resolve();
  }

  strummingChordsMap.set(chordName, {
    ...data,
    isClicked: false,
  });

  console.log("---> Strumming click released", chordName);
};

export const markChordAsPendingStrumming = (chordName: string) => {
  const data =
    strummingChordsMap.get(chordName) ??
    (() => {
      throw new Error("No record for strumming");
    })();
  setCurrentChord(chordName);
  strummingChordsMap.set(chordName, {
    state: StrummingState.PendingStrummingStart,
    promiseAndResolve: createStrummingPromise(),
    isClicked: true,
    clickPromiseAndResolve: data.clickPromiseAndResolve,
  });

  toggleInterval(true);
  console.log("---> Strumming pending starting", chordName);
};

export const markChordAsStrumming = (chordName: string) => {
  const data =
    strummingChordsMap.get(chordName) ??
    (() => {
      throw new Error("No record for strumming");
    })();
  strummingChordsMap.set(chordName, {
    state: StrummingState.Strumming,
    promiseAndResolve: data.promiseAndResolve,
    isClicked: data.isClicked ?? false,
    clickPromiseAndResolve: data.clickPromiseAndResolve,
  });
  console.log("---> Started strumming", chordName);
};

export const finishStrumming = (chordName: string) => {
  const promiseAndResolve =
    strummingChordsMap.get(chordName)?.promiseAndResolve;
  promiseAndResolve?.resolve();
  strummingChordsMap.delete(chordName);
  toggleInterval(false);
  console.log("---> Strumming finished. Grace period ended", chordName);
};
