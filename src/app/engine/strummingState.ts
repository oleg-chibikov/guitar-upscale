import { toggleInterval } from "../store/settingsSlice";

export const STRUMMING_LOG_PREFIX = "Strumming: ";

export let currentChord: string | undefined;

export const setCurrentChord = (chordName: string) => {
  currentChord = chordName;
};

export enum StrummingState {
  Clicked, // when chord button is being pressed for the first time
  PendingStrummingStart, // wait for the next interval/bar/other strumming to finish
  Strumming, // when the wait time is over and actual strumming starts
  GracePeriod, // one interval after strumming to allow switching between chords and keep playing
}

type PromiseAndResolve = {
  promise: Promise<void>;
  resolve: (value: void | PromiseLike<void>) => void;
};

type StrummingData = {
  isClicked: boolean;
  state: StrummingState;
  clickPromiseAndResolve?: PromiseAndResolve;
  strummingPromiseAndResolve?: PromiseAndResolve;
  gracePeriodPromiseAndResolve?: PromiseAndResolve;
};

export const strummingChordsMap = new Map<string, StrummingData>();
export const strummingClickedChords = new Set<string>(); // set of chords currently clicked

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

export const isAnythingStrumming = (): boolean => strummingChordsMap.size > 0;
export const isAnyStrummingClicked = (): boolean =>
  strummingClickedChords.size > 0;

export const areOtherChordsStrumming = (chordName: string): boolean =>
  Array.from(strummingChordsMap).filter((x) => x[0] !== chordName).length > 0;

export const getOtherChordsStrummingPromises = (
  chordName: string
): Promise<void>[] => {
  return Array.from(strummingChordsMap)
    .map(([name, data]) => {
      if (name !== chordName) {
        return data.strummingPromiseAndResolve?.promise; // There are other chords strumming
      }
    })
    .filter((x) => x) as Promise<void>[];
};

export const getOtherChordsGracePeriodPromises = (
  chordName: string
): Promise<void>[] => {
  return Array.from(strummingChordsMap)
    .map(([name, data]) => {
      if (name !== chordName) {
        return data.gracePeriodPromiseAndResolve?.promise; // There are other chords strumming
      }
    })
    .filter((x) => x) as Promise<void>[];
};

export const isChordClicked = (chordName: string) =>
  strummingChordsMap.get(chordName)?.isClicked === true;

export const getChordClickedPromise = (chordName: string) =>
  strummingChordsMap.get(chordName)?.clickPromiseAndResolve?.promise;

export const isChordStrummingOrPendingStrumming = (
  chordName: string
): boolean =>
  strummingChordsMap.get(chordName)?.state !== StrummingState.Clicked;

export const isChordStrumming = (chordName: string) =>
  strummingChordsMap.get(chordName)?.state === StrummingState.Strumming;

export const registerChordClick = (chordName: string, clickNumber: number) => {
  const data = strummingChordsMap.get(chordName);

  const clickPromiseAndResolve = createStrummingPromise();

  // might be clicked when already in another state
  strummingChordsMap.set(chordName, {
    state: data ? data.state : StrummingState.Clicked,
    strummingPromiseAndResolve: data?.strummingPromiseAndResolve,
    clickPromiseAndResolve,
    gracePeriodPromiseAndResolve: data?.gracePeriodPromiseAndResolve,
    isClicked: true,
  });

  strummingClickedChords.add(chordName);

  console.log(
    STRUMMING_LOG_PREFIX + "---> Strumming registered",
    chordName,
    clickNumber
  );
};

export const releaseChordClick = (chordName: string, clickNumber: number) => {
  const data = strummingChordsMap.get(chordName);

  if (!data) {
    return;
  }

  data.clickPromiseAndResolve?.resolve();

  strummingChordsMap.set(chordName, {
    ...data,
    isClicked: false,
    clickPromiseAndResolve: undefined,
  });

  strummingClickedChords.delete(chordName);

  console.log(
    STRUMMING_LOG_PREFIX + "---> Strumming click released",
    chordName,
    clickNumber
  );
};

export const markChordAsPendingStrumming = (
  chordName: string,
  clickNumber: number
) => {
  const data =
    strummingChordsMap.get(chordName) ??
    (() => {
      throw new Error(
        "No record for marking as pending strumming: " +
          chordName +
          " " +
          clickNumber
      );
    })();
  setCurrentChord(chordName);
  strummingChordsMap.set(chordName, {
    ...data,
    state: StrummingState.PendingStrummingStart,
    strummingPromiseAndResolve: createStrummingPromise(),
    isClicked: true,
  });

  strummingClickedChords.add(chordName);

  toggleInterval(true);
  console.log(
    STRUMMING_LOG_PREFIX + "---> Chord pending strumming start",
    chordName,
    clickNumber
  );
};

export const markChordAsStrumming = (
  chordName: string,
  clickNumber: number
) => {
  const data =
    strummingChordsMap.get(chordName) ??
    (() => {
      throw new Error(
        "No record for marking as strumming: " + chordName + " " + clickNumber
      );
    })();
  strummingChordsMap.set(chordName, {
    ...data,
    state: StrummingState.Strumming,
  });
  console.log(
    STRUMMING_LOG_PREFIX + "---> Started strumming",
    chordName,
    clickNumber
  );
};

// After calling this method strumming is allowed to continue for one more beat/bar (depends on the settings).
// It is needed to allow switching between chords immediately after the pattern is finished to repeat it instead of starting afresh
// Strumming is totally finished for the chord when setIsStrumming is called with the false value
export const startChordGracePeriod = (
  chordName: string,
  clickNumber: number
) => {
  const data =
    strummingChordsMap.get(chordName) ??
    (() => {
      throw new Error(
        "No record for starting grace period: " + chordName + " " + clickNumber
      );
    })();

  if (!data.strummingPromiseAndResolve) {
    throw new Error(
      "No record for strumming promise for starting grace period: " +
        chordName +
        " " +
        clickNumber
    );
  }

  data.strummingPromiseAndResolve.resolve();
  strummingChordsMap.set(chordName, {
    ...data,
    state: StrummingState.GracePeriod,
    strummingPromiseAndResolve: undefined,
    gracePeriodPromiseAndResolve: createStrummingPromise(),
  });
  console.log(
    STRUMMING_LOG_PREFIX +
      "---> Strumming pending finishing. Grace period started",
    chordName,
    clickNumber
  );
};

export const finishChordGracePeriod = (
  chordName: string,
  clickNumber: number
) => {
  const gracePeriodPromiseAndResolve =
    strummingChordsMap.get(chordName)?.gracePeriodPromiseAndResolve;
  gracePeriodPromiseAndResolve?.resolve();
  strummingChordsMap.delete(chordName);
  toggleInterval(false);
  console.log(
    STRUMMING_LOG_PREFIX + "---> Strumming finished. Grace period ended",
    chordName,
    clickNumber
  );
};
