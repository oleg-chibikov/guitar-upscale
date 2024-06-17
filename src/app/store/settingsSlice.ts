import { ChordPlayMode } from "@/app/data/chordPlayMode";
import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { ChordStrummingInterval } from "../data/chordStrummingInterval";
import { chordStrummingPatterns } from "../data/chordStrummingPatterns";
import { Instrument, InstrumentGroup } from "../data/instruments";
import { Note } from "../data/notes";
import { PlaybackType } from "../data/playbackType";
import { scalesMap } from "../data/scales";
import {
  getCurrentShift,
  getShiftedNote,
  parseStringToNotes,
  Tuning,
} from "../data/tunings";
import {
  chordNotesByName,
  generateAllChords,
} from "../engine/chords/chordsGenerator";
import { clearPreviousChords } from "../engine/eventBus";
import {
  generateNeckRepresentation,
  Neck,
} from "../engine/generateNeckRepresentation";

import { NoteChords } from "@/app/data/chordModes";
import { MAX_VOLUME } from "@/app/data/volume";
import {
  clearChordDetector,
  rebuildChordDetectorLookup,
} from "@/app/engine/chords/chordLookupBuilder";
import { clearScaleDetector } from "@/app/engine/scales/scaleLookupBuilder";
import {
  currentlyPlayingLooperChannels,
  currentlyRecordingLooperChannel,
} from "../engine/looper/looperShared";
import {
  isMainClockActive,
  resolveNextTick,
  startInterval,
  stopInterval,
  waitForNextHalfBeat,
} from "../engine/mainClock";
import { loadMetronome } from "../engine/sound/metronomeProvider";
import { loadInstrument } from "../engine/sound/soundHelper";
import { isAnythingStrumming } from "../engine/strummingState";
import { RootState } from "./store"; // Define RootState type

const getFirstScaleForGroup = (groupKey: string) =>
  scalesMap.get(groupKey)!.keys().next().value;

interface WithNeck {
  neck: Neck | null;
  chords: NoteChords[] | null;
  baseNote: Note;
}

interface WithIsPaused {
  isPaused: boolean;
}

interface WithMetronome {
  isMetronomeActive: boolean;
}

interface CanUpdateGuitarSettings {
  guitarSettingsUpdatedTrigger: boolean;
}

interface WithControls {
  scaleGroup: string;
  scale: string;
  baseNote: Note;
  tuning: Tuning;
}

interface WithChordIsBeingDetected {
  chordIsBeingDetected: boolean;
}
interface WithScaleIsBeingDetected {
  scaleIsBeingDetected: boolean;
}

interface SettingsState
  extends WithMetronome,
    WithIsPaused,
    WithNeck,
    WithControls,
    CanUpdateGuitarSettings,
    WithChordIsBeingDetected,
    WithScaleIsBeingDetected {
  tempoBpm: number;
  chordStrummingDelayMs: number;
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
  chordStrummingInterval: ChordStrummingInterval;
  useChordAlteration: boolean;
  chordCustomStrummingPattern: string;
  chordCustomStrummingWaitForPatternFinish: boolean;
  seamlessChordSwitching: boolean;
  isPlaying: boolean;
  isRecording: boolean;
  toggleMetronomeWhenRecording: boolean;
  isFirstEvent: boolean;
  isLastEvent: boolean;
}

const initialState: SettingsState = {
  scaleGroup: "Minor",
  scale: "Aeolian / Natural",
  baseNote: Note.E,
  neck: null,
  chords: null,
  tempoBpm: 140,
  chordStrummingDelayMs: 20,
  volume: MAX_VOLUME,
  metronomeVolume: MAX_VOLUME,
  playbackType: PlaybackType.Melody,
  chordPlayMode: ChordPlayMode.Closest_Variation,
  chordNotesToPlay: 6,
  tuning: "EBGDAE",
  instrumentGroup: "Guitar",
  instrument: "acoustic_guitar_nylon",
  chordInstrumentGroup: "Strings Orchestra",
  chordInstrument: "orchestral_harp",
  reverbStrength: 0.2,
  chordStrummingInterval: ChordStrummingInterval.HalfBeat,
  useChordAlteration: false,
  chordCustomStrummingPattern: chordStrummingPatterns[5], // 5 is a pattern of a medium difficulty - not that simple as 0
  chordCustomStrummingWaitForPatternFinish: true,
  seamlessChordSwitching: true,
  isMetronomeActive: false,
  isPlaying: false,
  isPaused: false,
  chordIsBeingDetected: false,
  scaleIsBeingDetected: false,
  isRecording: false,
  toggleMetronomeWhenRecording: true,
  guitarSettingsUpdatedTrigger: false,
  isFirstEvent: false,
  isLastEvent: false,
};

// A values that changes immediately without the need for rerender
// Consider them as a global refs
// They are controlling how it behaves - NOT how it looks like
// For settings affecting the UI use the state values, not these. State values are triggering rerender when changing

export let neckValue: Neck | null = initialState.neck;
export let chordsValue: NoteChords[] | null = initialState.chords;
export let volumeValue: number = initialState.volume;
export let metronomeVolumeValue: number = initialState.metronomeVolume;
export let tempoBpmValue: number = initialState.tempoBpm;
export let instrumentValue: Instrument = initialState.instrument;
export let chordInstrumentValue: Instrument = initialState.chordInstrument;
export let reverbStrengthValue: number = initialState.reverbStrength;
export let chordStrummingIntervalValue: ChordStrummingInterval =
  initialState.chordStrummingInterval;
export let useChordAlterationValue: boolean = initialState.useChordAlteration;
export let chordCustomStrummingPatternValue: string =
  initialState.chordCustomStrummingPattern;
export let chordCustomStrummingWaitForPatternFinishValue: boolean =
  initialState.chordCustomStrummingWaitForPatternFinish;
export let seamlessChordSwitchingValue: boolean =
  initialState.seamlessChordSwitching;
export let isMetronomeActiveValue = initialState.isMetronomeActive;
export let isPlayingValue: boolean = initialState.isPlaying;
export let isPausedValue: boolean = initialState.isPaused;
export let chordStrummingDelayMsValue: number =
  initialState.chordStrummingDelayMs;
export let chordIsBeingDetectedValue: boolean =
  initialState.chordIsBeingDetected;
export let scaleIsBeingDetectedValue: boolean =
  initialState.scaleIsBeingDetected;
export let chordPlayModeValue: ChordPlayMode = initialState.chordPlayMode;
export let chordNotesToPlayValue: number = initialState.chordNotesToPlay;
export let scaleGroupValue: string = initialState.scaleGroup;
export let scaleValue: string = initialState.scale;
export let baseNoteValue: Note = initialState.baseNote;
export let playbackTypeValue: PlaybackType = initialState.playbackType;
export let tuningValue: Tuning = initialState.tuning;
export let isRecordingValue: boolean = initialState.isRecording;
export let toggleMetronomeWhenRecordingValue: boolean =
  initialState.toggleMetronomeWhenRecording;
export let wipeExampleCacheTriggerValue: boolean = false;
export let isLastEventValue: boolean = initialState.isLastEvent;
export let isFirstEventValue: boolean = initialState.isFirstEvent;

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
  const scaleNotesWithoutZero = scalesMap
    .get(state.scaleGroup)!
    .get(state.scale);
  const scalePattern = new Set(scaleNotesWithoutZero?.concat([0])); // all scales include 0, so it's omitted from the scales themselves

  const baseNote = state.baseNote;
  const neck = generateNeckRepresentation(
    scalePattern,
    parseStringToNotes(tuningValue),
    getShiftedNote(baseNote),
    baseNote
  );
  state.neck = neck;
  neckValue = neck;
  setChords(state);
  clearPreviousChords();
  if (!preventScaleDetectorFlush) {
    updateScaleIsBeingDetected(state, false);
    clearScaleDetector?.();
  }
  // this can notify all the controls that use this prop to rerender
  state.guitarSettingsUpdatedTrigger = !state.guitarSettingsUpdatedTrigger;
};

const toggleMetronome = (state: WithMetronome, value: boolean) => {
  state.isMetronomeActive = value;
  isMetronomeActiveValue = value;
  toggleInterval(value);
};

export const clearWipeExampleCacheTrigger = () => {
  wipeExampleCacheTriggerValue = false;
};

const setChords = (state: WithNeck & WithChordIsBeingDetected) => {
  if (!state.neck) {
    return;
  }

  // Passing true for useAdvancedChords to generate them all (in order to play in examples). But the user can show them only being premium
  chordNotesByName.clear();
  const chordsForNeck = generateAllChords(state.neck, true, state.baseNote);
  state.chords = chordsForNeck;
  chordsValue = chordsForNeck;
  clearChordDetector?.();
  updateChordIsBeingDetected(state, false);
  rebuildChordDetectorLookup();
};

export const isAnyTimerSpecificActivityBesidesMetronomeRunning = () =>
  isAnythingStrumming() ||
  isPlayingValue ||
  isRecordingValue ||
  currentlyRecordingLooperChannel !== undefined ||
  currentlyPlayingLooperChannels.size > 0;

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

const updateChordIsBeingDetected = (
  state: WithChordIsBeingDetected,
  value: boolean
) => {
  state.chordIsBeingDetected = value;
  chordIsBeingDetectedValue = value;
  if (!value) {
    clearChordDetector?.();
  }
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

export const toggleInterval = (toggle: boolean) => {
  if (toggle) {
    // starting time-based activity
    if (!isMainClockActive()) {
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
      chordStrummingIntervalValue = state.chordStrummingInterval;
      useChordAlterationValue = state.useChordAlteration;
      chordCustomStrummingPatternValue = state.chordCustomStrummingPattern;
      chordCustomStrummingWaitForPatternFinishValue =
        state.chordCustomStrummingWaitForPatternFinish;
      seamlessChordSwitchingValue = state.seamlessChordSwitching;
      isMetronomeActiveValue = state.isMetronomeActive;
      chordStrummingDelayMsValue = state.chordStrummingDelayMs;
      chordIsBeingDetectedValue = state.chordIsBeingDetected;
      scaleIsBeingDetectedValue = state.scaleIsBeingDetected;
      chordPlayModeValue = state.chordPlayMode;
      chordNotesToPlayValue = state.chordNotesToPlay;
      isPlayingValue = state.isPlaying;
      isPausedValue = state.isPaused;
      scaleGroupValue = state.scaleGroup;
      scaleValue = state.scale;
      baseNoteValue = state.baseNote;
      isRecordingValue = state.isRecording;
      playbackTypeValue = state.playbackType;
      tuningValue = state.tuning;
      isLastEventValue = state.isLastEvent;
      isFirstEventValue = state.isFirstEvent;
      toggleMetronomeWhenRecordingValue = state.toggleMetronomeWhenRecording;
      neckValue = state.neck;
      chordsValue = state.chords;
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
    setBaseNote: (state, action: PayloadAction<Note>) => {
      state.baseNote = action.payload;
      baseNoteValue = action.payload;
      wipeExampleCacheTriggerValue = true;
      onGuitarSettingsUpdate(state);
    },
    setTuning(state, action: PayloadAction<Tuning>) {
      const previousShift = getCurrentShift();
      state.tuning = action.payload;
      tuningValue = action.payload;
      const newShift = getCurrentShift();
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
    setChordStrummingInterval(
      state,
      action: PayloadAction<ChordStrummingInterval>
    ) {
      state.chordStrummingInterval = action.payload;
      chordStrummingIntervalValue = action.payload;
    },
    setUseChordAlteration(state, action: PayloadAction<boolean>) {
      state.useChordAlteration = action.payload;
      useChordAlterationValue = action.payload;
    },
    setChordCustomStrummingPattern(state, action: PayloadAction<string>) {
      state.chordCustomStrummingPattern = action.payload;
      chordCustomStrummingPatternValue = action.payload;
    },
    setChordCustomStrummingWaitForPatternFinish(
      state,
      action: PayloadAction<boolean>
    ) {
      state.chordCustomStrummingWaitForPatternFinish = action.payload;
      chordCustomStrummingWaitForPatternFinishValue = action.payload;
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
      toggleInterval(isPlayingValue);
    },
    setIsPaused(state, action: PayloadAction<boolean>) {
      updateIsPaused(action.payload, state);
    },
    setChordIsBeingDetected(state, action: PayloadAction<boolean>) {
      updateChordIsBeingDetected(state, action.payload);
    },
    setScaleIsBeingDetected(state, action: PayloadAction<boolean>) {
      updateScaleIsBeingDetected(state, action.payload);
    },
    setToggleMetronomeWhenRecording(state, action: PayloadAction<boolean>) {
      state.toggleMetronomeWhenRecording = action.payload;
      toggleMetronomeWhenRecordingValue = action.payload;
    },
    setIsRecording(
      state,
      action: PayloadAction<{
        value: boolean;
        startRecording: () => void;
        stopRecording: () => void;
      }>
    ) {
      const value = action.payload.value;
      state.isRecording = value;
      isRecordingValue = value;
      toggleInterval(value);

      const canTriggerMetronome =
        toggleMetronomeWhenRecordingValue && isMetronomeActiveValue !== value;
      if (value) {
        action.payload.startRecording();
        if (canTriggerMetronome) {
          toggleMetronome(state, true);
        }
      } else {
        action.payload.stopRecording();
        if (
          canTriggerMetronome &&
          !isAnyTimerSpecificActivityBesidesMetronomeRunning()
        ) {
          // only stop metronome when there is no other playing activity
          toggleMetronome(state, false);
        }
      }
    },
  },
});

export const {
  init,
  setScale,
  setScaleGroup,
  setBaseNote,
  setTempoBpm,
  setVolume,
  setMetronomeVolume,
  setPlaybackType,
  setChordStrummingDelayMs,
  setChordPlayMode,
  setChordNotesToPlay,
  setTuning,
  setInstrument,
  setInstrumentGroup,
  setChordInstrument,
  setChordInstrumentGroup,
  setReverbStrength,
  setChordStrummingInterval,
  setUseChordAlteration,
  setChordCustomStrummingPattern,
  setChordCustomStrummingWaitForPatternFinish,
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
} = settingsSlice.actions;

export const selectSettings = (state: RootState) => state.settings;

export default settingsSlice.reducer;
