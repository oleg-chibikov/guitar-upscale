import { ChordPlayMode } from "@/app/data/chordPlayMode";
import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { Instrument, InstrumentGroup } from "../data/instruments";
import { Note } from "../data/notes";
import { PlaybackType } from "../data/playbackType";
import { getScalePattern, scalesMap } from "../data/scales";
import { chordStrummingPatterns } from "../data/strummingPatterns";
import {
  getCurrentShift,
  getOctaveNotesForTuning,
  getShiftedNote,
  Tuning,
} from "../data/tunings";
import { clearPreviousChords } from "../engine/eventBus";
import {
  generateNeckRepresentation,
  Neck,
} from "../engine/generateNeckRepresentation";

import { ChordModeVariations } from "@/app/data/chordModes";
import { MAX_VOLUME } from "@/app/data/volume";
import { clearChordDetector } from "@/app/engine/chords/chordLookupBuilder";
import { clearScaleDetector } from "@/app/engine/scales/scaleLookupBuilder";
import { getPatternById } from "@/app/engine/strummingPatternsStorage";
import {
  isMainClockActiveValue,
  resolveNextTick,
  startInterval,
  stopInterval,
  waitForNextHalfBeat,
} from "../engine/clock/mainClock";
import {
  checkLooperPlaying,
  currentlyRecordingLooperChannel,
} from "../engine/looper/looperShared";
import { loadMetronome } from "../engine/sound/metronomeProvider";
import { loadInstrument } from "../engine/sound/soundHelper";
import { isAnythingStrumming } from "../engine/strummingState";

const getFirstScaleForGroup = (groupKey: string) =>
  scalesMap.get(groupKey)!.keys().next().value;

interface WithNeck {
  neck: Neck | null;
  capo: number;
  stringCount: number;
}

interface WithIsPaused {
  isPaused: boolean;
}

interface WithMetronome {
  isMetronomeActive: boolean;
}

interface CanUpdateGuitarSettings {
  guitarSettingsUpdateCount?: number;
}

interface WithControls {
  scaleGroup: string;
  scale: string;
  capo: number;
  tuning: Tuning;
}

interface WithChordIsBeingDetected {
  chordIsBeingDetected: boolean;
}
interface WithScaleIsBeingDetected {
  scaleIsBeingDetected: boolean;
}

interface WithCustomStrummingPatternId {
  strummingPatternId: number;
}

interface SettingsState
  extends WithMetronome,
    WithIsPaused,
    WithNeck,
    WithControls,
    CanUpdateGuitarSettings,
    WithChordIsBeingDetected,
    WithScaleIsBeingDetected,
    WithCustomStrummingPatternId {
  tempoBpm: number;
  chordStrummingDelayMs: number;
  chordStrummingImmediateGracePeriodMs: number;
  volume: number;
  metronomeVolume: number;
  playbackType: PlaybackType;
  chordPlayMode: ChordPlayMode;
  chordNotesToPlay: number;
  tuning: Tuning;
  instrumentGroup: InstrumentGroup;
  instrument: Instrument;
  chordInstrumentGroup: InstrumentGroup;
  chordInstrument: Instrument;
  reverbStrength: number;
  useChordAlteration: boolean;
  waitForPatternFinish: boolean;
  seamlessChordSwitching: boolean;
  isPlaying: boolean;
  isRecording: boolean;
  toggleMetronomeWhenRecording: boolean;
  isFirstEvent: boolean;
  isLastEvent: boolean;
  looperStateUpdateTrigger: boolean;
  isLooperPlaying: boolean;
  strummingPatternChangedTrigger: boolean;
  chordsAreLoading: boolean;
  slashChordBassNote?: Note; // may be undefined
  chordDetectorAvailable?: boolean; // may be undefined
  scaleDetectorAvailable?: boolean; // may be undefined
  showReplayTrigger: boolean;
}

const initialState: SettingsState = {
  scaleGroup: "Minor",
  scale: "Aeolian / Natural",
  capo: 0,
  neck: null,
  tempoBpm: 120,
  chordStrummingDelayMs: 0,
  chordStrummingImmediateGracePeriodMs: 500,
  volume: MAX_VOLUME,
  metronomeVolume: MAX_VOLUME,
  playbackType: PlaybackType.Melody,
  chordPlayMode: ChordPlayMode.Preferred_Variation,
  chordNotesToPlay: 6,
  tuning: "EBGDAE",
  instrumentGroup: "Guitar",
  instrument: "acoustic_guitar_nylon",
  chordInstrumentGroup: "Strings Orchestra",
  chordInstrument: "orchestral_harp",
  reverbStrength: 0.2,
  useChordAlteration: false,
  strummingPatternId: chordStrummingPatterns[7].id, // it is a pattern of a medium difficulty - not that simple as the very first one
  waitForPatternFinish: true,
  seamlessChordSwitching: true,
  isMetronomeActive: false,
  isPlaying: false,
  isPaused: false,
  chordIsBeingDetected: false,
  scaleIsBeingDetected: false,
  isRecording: false,
  toggleMetronomeWhenRecording: true,
  isFirstEvent: false,
  isLastEvent: false,
  looperStateUpdateTrigger: false,
  isLooperPlaying: false,
  strummingPatternChangedTrigger: false,
  stringCount: 6,
  chordsAreLoading: false,
  showReplayTrigger: false,
};

// A values that changes immediately without the need for rerender
// Consider them as a global refs
// They are controlling how it behaves - NOT how it looks like
// For settings affecting the UI use the state values, not these. State values are triggering rerender when changing

export let neckValue: Neck | null = initialState.neck;
export let stringCountValue: number = initialState.stringCount;
export const chordsValue: ChordModeVariations[] = [];
export let volumeValue: number = initialState.volume;
export let metronomeVolumeValue: number = initialState.metronomeVolume;
export let tempoBpmValue: number = initialState.tempoBpm;
export let instrumentValue: Instrument = initialState.instrument;
export let chordInstrumentValue: Instrument = initialState.chordInstrument;
export let reverbStrengthValue: number = initialState.reverbStrength;
export let useChordAlterationValue: boolean = initialState.useChordAlteration;
export let strummingPatternIdValue: number = initialState.strummingPatternId;
export let waitForPatternFinishValue: boolean =
  initialState.waitForPatternFinish;
export let seamlessChordSwitchingValue: boolean =
  initialState.seamlessChordSwitching;
export let isMetronomeActiveValue = initialState.isMetronomeActive;
export let isPlayingValue: boolean = initialState.isPlaying;
export let isPausedValue: boolean = initialState.isPaused;
export let chordStrummingDelayMsValue: number =
  initialState.chordStrummingDelayMs;
export let chordStrummingImmediateGracePeriodMsValue: number =
  initialState.chordStrummingImmediateGracePeriodMs;
export let chordIsBeingDetectedValue: boolean =
  initialState.chordIsBeingDetected;
export let scaleIsBeingDetectedValue: boolean =
  initialState.scaleIsBeingDetected;
export let chordPlayModeValue: ChordPlayMode = initialState.chordPlayMode;
export let chordNotesToPlayValue: number = initialState.chordNotesToPlay;
export let scaleGroupValue: string = initialState.scaleGroup;
export let scaleValue: string = initialState.scale;
export let capoValue: number = initialState.capo;
export let playbackTypeValue: PlaybackType = initialState.playbackType;
export let tuningValue: Tuning = initialState.tuning;
export let isRecordingValue: boolean = initialState.isRecording;
export let toggleMetronomeWhenRecordingValue: boolean =
  initialState.toggleMetronomeWhenRecording;
export let wipeExampleCacheTriggerValue: boolean = false;
export let isLastEventValue: boolean = initialState.isLastEvent;
export let isFirstEventValue: boolean = initialState.isFirstEvent;
export let chordsAreLoadingValue: boolean = initialState.chordsAreLoading;
export let slashChordBassNoteValue: Note | undefined =
  initialState.slashChordBassNote;

export let preventScaleDetectorFlush: boolean = false;
export const setPreventScaleDetectorFlush = (value: boolean) => {
  preventScaleDetectorFlush = value;
};

const onGuitarSettingsUpdate = (
  state: WithControls &
    WithNeck &
    CanUpdateGuitarSettings &
    WithChordIsBeingDetected &
    WithScaleIsBeingDetected
) => {
  const scalePattern = getScalePattern(state.scaleGroup, state.scale); // all scales include 0, so it's omitted from the scales themselves

  const capo = state.capo;
  const neck = generateNeckRepresentation(
    scalePattern,
    getOctaveNotesForTuning(tuningValue),
    getShiftedNote(capo, tuningValue),
    capo
  );
  state.neck = neck;
  state.stringCount = neck.length;
  neckValue = neck;
  stringCountValue = state.stringCount;
  clearPreviousChords();
  if (!preventScaleDetectorFlush) {
    updateScaleIsBeingDetected(state, false);
    clearScaleDetector?.();
  }
  // this can notify all the controls that use this prop to rerender
  state.guitarSettingsUpdateCount = (state.guitarSettingsUpdateCount ?? 0) + 1;
};

const toggleMetronome = (state: WithMetronome, value: boolean) => {
  state.isMetronomeActive = value;
  isMetronomeActiveValue = value;
  tryToggleInterval(value);
};

export const clearWipeExampleCacheTrigger = () => {
  wipeExampleCacheTriggerValue = false;
};

export const isAnyTimerSpecificActivityBesidesMetronomeRunning = () =>
  isAnythingStrumming() ||
  isPlayingValue ||
  isRecordingValue ||
  currentlyRecordingLooperChannel !== undefined ||
  checkLooperPlaying();

export const isAnyTimerSpecificActivityRunning = () =>
  isMetronomeActiveValue || isAnyTimerSpecificActivityBesidesMetronomeRunning();

// this promise is resolved only when pause is released
let pausePromise: Promise<PauseResolveValue | undefined> =
  Promise.resolve(undefined);

export const waitForPauseToBeReleased = async (): Promise<
  PauseResolveValue | undefined
> => {
  if (!isPausedValue) {
    return;
  }
  const afterPauseAction = await pausePromise;
  if (afterPauseAction !== undefined) {
    return afterPauseAction;
  }
  await waitForNextHalfBeat(); // wait for the next interval after pause has been released. Otherwise 2 notes might play simultaneously
};

let resolvePause: (
  value:
    | PauseResolveValue
    | PromiseLike<PauseResolveValue | undefined>
    | undefined
) => void = () => null;

const recreatePausePromise = () => {
  pausePromise = new Promise<PauseResolveValue | undefined>((resolve) => {
    resolvePause = resolve;
  });
};

const updateIsPaused = (value: boolean, state: WithIsPaused) => {
  isPausedValue = value;
  state.isPaused = isPausedValue;
  resolvePause(undefined);
  recreatePausePromise();
};

const updateScaleIsBeingDetected = (
  state: WithScaleIsBeingDetected,
  value: boolean
) => {
  state.scaleIsBeingDetected = value;
  scaleIsBeingDetectedValue = value;
  if (!value) {
    clearScaleDetector?.();
  }
};

const updateStrummingPatternId = (
  state: WithCustomStrummingPatternId,
  id: number
) => {
  state.strummingPatternId = id;
  strummingPatternIdValue = id;
};

export const moveCurrentPlayPosition = (type: PauseResolveValue) => {
  console.log("Resolving next tick");
  resolveNextTick();
  // setTimeout here helps to allow MidiPlayer to go into "Waiting for pause" state and process the next/prev event correctly
  setTimeout(() => {
    console.log("Resolving pause with type", type);
    resolvePause(type); // release one tick and set pause again
    console.log("Pause resolved");
    recreatePausePromise();
  }, 1);
};

export const tryToggleInterval = (toggle: boolean) => {
  if (toggle) {
    // starting time-based activity
    if (!isMainClockActiveValue) {
      console.log("Clock not active - starting it");
      startInterval(true);
    }
  } else {
    // stopping clock if nothing is playing
    if (!isAnyTimerSpecificActivityRunning()) {
      console.log("Nothing playing - stopping clock");
      stopInterval(true);
    }
  }
};

export const addChordMode = (chordModeVariations: ChordModeVariations) => {
  chordsValue.push(chordModeVariations);
};

export enum PauseResolveValue {
  GoBack,
  GoForward,
}

export const settingsSlice = createSlice({
  name: "settings",
  initialState,
  reducers: {
    init: (state) => {
      // update initial settings after they got loaded from redux persist
      volumeValue = state.volume;
      metronomeVolumeValue = state.metronomeVolume;
      tempoBpmValue = state.tempoBpm;
      instrumentValue = state.instrument;
      chordInstrumentValue = state.chordInstrument;
      reverbStrengthValue = state.reverbStrength;
      useChordAlterationValue = state.useChordAlteration;
      strummingPatternIdValue = state.strummingPatternId;
      waitForPatternFinishValue = state.waitForPatternFinish;
      seamlessChordSwitchingValue = state.seamlessChordSwitching;
      isMetronomeActiveValue = state.isMetronomeActive;
      chordStrummingDelayMsValue = state.chordStrummingDelayMs;
      chordStrummingImmediateGracePeriodMsValue =
        state.chordStrummingImmediateGracePeriodMs;
      chordIsBeingDetectedValue = state.chordIsBeingDetected;
      scaleIsBeingDetectedValue = state.scaleIsBeingDetected;
      chordPlayModeValue = state.chordPlayMode;
      chordNotesToPlayValue = state.chordNotesToPlay;
      isPlayingValue = state.isPlaying;
      isPausedValue = state.isPaused;
      scaleGroupValue = state.scaleGroup;
      scaleValue = state.scale;
      capoValue = state.capo;
      isRecordingValue = state.isRecording;
      playbackTypeValue = state.playbackType;
      tuningValue = state.tuning;
      isLastEventValue = state.isLastEvent;
      isFirstEventValue = state.isFirstEvent;
      toggleMetronomeWhenRecordingValue = state.toggleMetronomeWhenRecording;
      neckValue = state.neck;
      stringCountValue = state.stringCount;
      chordsAreLoadingValue = state.chordsAreLoading;
      slashChordBassNoteValue = state.slashChordBassNote;
      onGuitarSettingsUpdate(state);
      void loadInstrument(instrumentValue, reverbStrengthValue);
      void loadInstrument(chordInstrumentValue, reverbStrengthValue);
      void loadMetronome();
    },
    setScaleGroup: (state, action: PayloadAction<string>) => {
      state.scaleGroup = action.payload;
      state.scale = getFirstScaleForGroup(action.payload);
      scaleGroupValue = state.scaleGroup;
      scaleValue = state.scale;
      onGuitarSettingsUpdate(state);
    },
    setIsFirstEvent: (state, action: PayloadAction<boolean>) => {
      state.isFirstEvent = action.payload;
      isFirstEventValue = action.payload;
    },
    setIsLastEvent: (state, action: PayloadAction<boolean>) => {
      state.isLastEvent = action.payload;
      isLastEventValue = action.payload;
    },
    setScale: (state, action: PayloadAction<string>) => {
      state.scale = action.payload;
      scaleValue = state.scale;
      onGuitarSettingsUpdate(state);
    },
    setCapo: (state, action: PayloadAction<Note>) => {
      state.capo = action.payload;
      capoValue = action.payload;
      wipeExampleCacheTriggerValue = true;
      onGuitarSettingsUpdate(state);
    },
    setTuning(state, action: PayloadAction<Tuning>) {
      const previousShift = getCurrentShift(tuningValue);
      state.tuning = action.payload;
      tuningValue = action.payload;
      const newShift = getCurrentShift(tuningValue);
      if (previousShift !== newShift) {
        // all the decoded examples should be deleted if the scale shift changes.
        // They will be deleted async right before the next example is played. (this is needed to avoid loading examples module here)
        wipeExampleCacheTriggerValue = true;
      }
      onGuitarSettingsUpdate(state);
    },
    setTempoBpm: (
      state,
      action: PayloadAction<{ tempo: number; updateInterval: boolean }>
    ) => {
      const newValue = action.payload.tempo;
      if (tempoBpmValue === newValue) {
        return;
      }
      console.log("Setting tempo to", newValue);
      state.tempoBpm = newValue;
      tempoBpmValue = newValue;

      if (action.payload.updateInterval) {
        stopInterval(false);
        startInterval(false); // afresh is set to false to maintain current beat/bar position
      }
    },
    setChordStrummingDelayMs(state, action: PayloadAction<number>) {
      state.chordStrummingDelayMs = action.payload;
      chordStrummingDelayMsValue = action.payload;
    },
    setChordStrummingImmediateGracePeriodMs(
      state,
      action: PayloadAction<number>
    ) {
      state.chordStrummingImmediateGracePeriodMs = action.payload;
      chordStrummingImmediateGracePeriodMsValue = action.payload;
    },
    setVolume: (state, action: PayloadAction<number>) => {
      state.volume = action.payload;
      volumeValue = action.payload;
    },
    setMetronomeVolume: (state, action: PayloadAction<number>) => {
      state.metronomeVolume = action.payload;
      metronomeVolumeValue = action.payload;
    },
    setPlaybackType(state, action: PayloadAction<PlaybackType>) {
      state.playbackType = action.payload;
      playbackTypeValue = action.payload;
    },
    setChordPlayMode(state, action: PayloadAction<ChordPlayMode>) {
      state.chordPlayMode = action.payload;
      chordPlayModeValue = action.payload;
    },
    setChordNotesToPlay(state, action: PayloadAction<number>) {
      state.chordNotesToPlay = action.payload;
      chordNotesToPlayValue = action.payload;
    },
    setInstrument(state, action: PayloadAction<Instrument>) {
      state.instrument = action.payload;
      instrumentValue = action.payload;
    },
    setInstrumentGroup: (state, action: PayloadAction<InstrumentGroup>) => {
      // TODO: lazy load instruments.ts if permissions allow
      state.instrumentGroup = action.payload;
    },
    setChordInstrument(state, action: PayloadAction<Instrument>) {
      state.chordInstrument = action.payload;
      chordInstrumentValue = action.payload;
    },
    setChordInstrumentGroup: (
      state,
      action: PayloadAction<InstrumentGroup>
    ) => {
      state.chordInstrumentGroup = action.payload;
    },
    setReverbStrength(state, action: PayloadAction<number>) {
      state.reverbStrength = action.payload;
      reverbStrengthValue = action.payload;
    },
    setUseChordAlteration(state, action: PayloadAction<boolean>) {
      state.useChordAlteration = action.payload;
      useChordAlterationValue = action.payload;
    },
    setStrummingPatternId(state, action: PayloadAction<number>) {
      updateStrummingPatternId(state, action.payload);
    },
    setWaitForPatternFinish(state, action: PayloadAction<boolean>) {
      state.waitForPatternFinish = action.payload;
      waitForPatternFinishValue = action.payload;
    },
    setSeamlessChordSwitching(state, action: PayloadAction<boolean>) {
      state.seamlessChordSwitching = action.payload;
      seamlessChordSwitchingValue = action.payload;
    },
    setIsMetronomeActive(state, action: PayloadAction<boolean>) {
      toggleMetronome(state, action.payload);
    },
    setIsPlaying(state, action: PayloadAction<boolean>) {
      isPlayingValue = action.payload;
      state.isPlaying = isPlayingValue;
      if (!isPlayingValue) {
        updateIsPaused(false, state);
      }
      tryToggleInterval(isPlayingValue);
    },
    setIsPaused(state, action: PayloadAction<boolean>) {
      updateIsPaused(action.payload, state);
    },
    setChordIsBeingDetected(state, action: PayloadAction<boolean>) {
      const value = action.payload;
      state.chordIsBeingDetected = value;
      chordIsBeingDetectedValue = value;
      if (!value) {
        clearChordDetector?.();
      }
    },
    setScaleIsBeingDetected(state, action: PayloadAction<boolean>) {
      updateScaleIsBeingDetected(state, action.payload);
    },
    setToggleMetronomeWhenRecording(state, action: PayloadAction<boolean>) {
      state.toggleMetronomeWhenRecording = action.payload;
      toggleMetronomeWhenRecordingValue = action.payload;
    },
    setIsRecording(state, action: PayloadAction<boolean>) {
      const value = action.payload;
      state.isRecording = value;
      isRecordingValue = value;
    },
    triggerLooperStateUpdate(state) {
      state.looperStateUpdateTrigger = !state.looperStateUpdateTrigger;
    },
    setIsLooperPlaying(state, action: PayloadAction<boolean>) {
      state.isLooperPlaying = action.payload;
    },
    triggerCustomStrummingPatternChanged(state) {
      state.strummingPatternChangedTrigger =
        !state.strummingPatternChangedTrigger;
    },
    checkCustomStrummingPatternAfterDeletion(state) {
      if (!getPatternById(state.strummingPatternId)) {
        updateStrummingPatternId(state, initialState.strummingPatternId);
      }
    },
    setChordsAreLoading(state, action: PayloadAction<boolean>) {
      state.chordsAreLoading = action.payload;
      chordsAreLoadingValue = action.payload;
    },
    setSlashChordBassNote(state, action: PayloadAction<Note | undefined>) {
      const value =
        state.slashChordBassNote === action.payload
          ? undefined
          : action.payload;
      state.slashChordBassNote = value;
      slashChordBassNoteValue = value;
    },
    setChordDetectorAvailable(state, action: PayloadAction<boolean>) {
      state.chordDetectorAvailable = action.payload;
    },
    setScaleDetectorAvailable(state, action: PayloadAction<boolean>) {
      state.scaleDetectorAvailable = action.payload;
    },
    triggerShowReplay(state) {
      state.showReplayTrigger = !state.showReplayTrigger;
    },
  },
});

export const {
  init,
  setScale,
  setScaleGroup,
  setCapo,
  setTempoBpm,
  setVolume,
  setMetronomeVolume,
  setPlaybackType,
  setChordStrummingDelayMs,
  setChordStrummingImmediateGracePeriodMs,
  setChordPlayMode,
  setChordNotesToPlay,
  setTuning,
  setInstrument,
  setInstrumentGroup,
  setChordInstrument,
  setChordInstrumentGroup,
  setReverbStrength,
  setUseChordAlteration,
  setStrummingPatternId,
  setWaitForPatternFinish,
  setSeamlessChordSwitching,
  setIsMetronomeActive,
  setIsPlaying,
  setIsPaused,
  setChordIsBeingDetected,
  setScaleIsBeingDetected,
  setIsRecording,
  setToggleMetronomeWhenRecording,
  setIsFirstEvent,
  setIsLastEvent,
  triggerLooperStateUpdate,
  setIsLooperPlaying,
  triggerCustomStrummingPatternChanged,
  checkCustomStrummingPatternAfterDeletion,
  setChordsAreLoading,
  setSlashChordBassNote,
  setChordDetectorAvailable,
  setScaleDetectorAvailable,
  triggerShowReplay,
} = settingsSlice.actions;

export default settingsSlice.reducer;
