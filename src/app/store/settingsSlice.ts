import { ChordPlayMode } from "@/app/data/chordPlayMode";
import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { ChordStrummingInterval } from "../data/chordStrummingInterval";
import { chordStrummingPatterns } from "../data/chordStrummingPatterns";
import { Instrument, InstrumentGroup } from "../data/instruments";
import { Chord, getNoteText, MAX_VELOCITY, Note } from "../data/notes";
import { PlaybackType } from "../data/playbackType";
import { scalesMap } from "../data/scales";
import { parseStringToNotes, Tuning } from "../data/tunings";
import {
  addChordToLookup,
  createChordDetectorLookup,
} from "../engine/chordDetector";
import {
  generateAllChords,
  getClosestVariation,
  getModeText,
  NoteChords,
} from "../engine/chordsGenerator";
import { clearPreviousChords } from "../engine/eventBus";
import {
  generateNeckRepresentation,
  Neck,
} from "../engine/generateNeckRepresentation";
import {
  isMainClockTicking,
  startInterval,
  stopInterval,
} from "../engine/mainClock";
import { loadMetronome } from "../engine/sound/metronomeProvider";
import { loadInstrument } from "../engine/sound/soundHelper";
import { RootState } from "./store"; // Define RootState type

const getFirstScaleForGroup = (groupKey: string) =>
  scalesMap.get(groupKey)!.keys().next().value;

interface WithNeck {
  neck: Neck | null;
  chords: NoteChords[] | null;
  baseNote: Note;
}

interface WithControls {
  scaleGroup: string;
  scale: string;
  baseNote: Note;
  tuning: Tuning;
}

interface SettingsState extends WithNeck, WithControls {
  tempoBpm: number;
  chordStrummingDelayMs: number;
  velocity: number;
  metronomeVelocity: number;
  playbackType: PlaybackType;
  switchToChromaticScale: boolean;
  useAdvancedChords: boolean;
  useSharpChords: boolean;
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
  isMetronomeTicking: boolean;
  isPlaying: boolean;
  chordIsBeingDetected: boolean;
}

const initialState: SettingsState = {
  scaleGroup: "Common Minor",
  scale: "Aeolian / Natural",
  baseNote: Note.E,
  neck: null,
  chords: null,
  tempoBpm: 140,
  chordStrummingDelayMs: 20,
  velocity: MAX_VELOCITY,
  metronomeVelocity: MAX_VELOCITY,
  playbackType: PlaybackType.Melody,
  switchToChromaticScale: true,
  useAdvancedChords: true,
  useSharpChords: true,
  chordPlayMode: ChordPlayMode.Closest_Variation,
  chordNotesToPlay: 6,
  tuning: "EBGDAE",
  instrumentGroup: "Guitar",
  instrument: "acoustic_guitar_nylon",
  chordInstrumentGroup: "Strings Orchestra",
  chordInstrument: "orchestral_harp",
  reverbStrength: 0.2,
  chordStrummingInterval: ChordStrummingInterval.Tick,
  useChordAlteration: false,
  chordCustomStrummingPattern: chordStrummingPatterns[5], // 5 is a pattern of a medium difficulty - not that simple as 0
  chordCustomStrummingWaitForPatternFinish: true,
  seamlessChordSwitching: true,
  isMetronomeTicking: false,
  isPlaying: false,
  chordIsBeingDetected: false,
};

// A values that changes immediately without the need for rerender
// Consider them as a global refs
// They are controlling how it behaves - NOT how it looks like
// For settings affecting the UI use the state values, not these. State values are triggering rerender when changing

export let velocityValue: number = initialState.velocity;
export let metronomeVelocityValue: number = initialState.metronomeVelocity;
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
export let isMetronomeTickingValue = initialState.isMetronomeTicking;
export let isPlayingValue: boolean = initialState.isPlaying;
export let chordStrummingDelayMsValue: number =
  initialState.chordStrummingDelayMs;
export let chordIsBeingDetectedValue: boolean =
  initialState.chordIsBeingDetected;
export let chordPlayModeValue: ChordPlayMode = initialState.chordPlayMode;
export let chordNotesToPlayValue: number = initialState.chordNotesToPlay;

export let strummingChordsMap = new Set<string>();
export let chordsMap = new Map<string, Chord>();

export let currentChord: string | undefined;

export const setCurrentChord = (chordName: string) => {
  currentChord = chordName;
};

export let waitForStrummingToFinish: (() => void) | undefined;
let finishStrumming: (() => void) | undefined;

const createStrummingPromise = () => {
  let promise: Promise<void>;
  promise = new Promise<void>((resolve) => {
    finishStrumming = resolve;
  });

  waitForStrummingToFinish = async () => {
    await promise;
  };
};

export const setIsStrumming = (chordName: string, value: boolean) => {
  if (value) {
    strummingChordsMap.add(chordName);
    createStrummingPromise();
  } else {
    strummingChordsMap.delete(chordName);
    finishStrumming?.();
    waitForStrummingToFinish = undefined;
    finishStrumming = undefined;
  }
  toggleInterval(value);
  return strummingChordsMap.size > 0;
};

const onGuitarSettingsUpdate = (state: WithControls & WithNeck) => {
  const scaleNotes = scalesMap.get(state.scaleGroup)!.get(state.scale);
  const scalePattern = new Set(scaleNotes?.concat([0]));

  // Just for debug
  // checkDuplicateScales(scalesMap);
  const neck = generateNeckRepresentation(
    scalePattern,
    parseStringToNotes(state.tuning),
    state.baseNote
  );
  state.neck = neck;
  setChords(state);
  clearPreviousChords();
};

const setChords = (state: WithNeck) => {
  if (state.neck) {
    // Passing true for useAdvancedChords to generate them all (in order to play in examples). But the user can show them only being premium
    const chordsForNeck = generateAllChords(state.neck, true, state.baseNote);
    state.chords = chordsForNeck;

    // TODO: only do that if chordDetector feature is enabled
    createChordDetectorLookup();
    chordsMap = new Map<string, Chord>(); // name to chord (notes)
    for (const chord of chordsForNeck) {
      const key = getNoteText(chord.note);
      for (const mode of chord.modes) {
        const modeKey = getModeText(mode.mode);
        const fullKey = key + modeKey;
        const closestVariation = getClosestVariation(mode);
        // TODO: only do that if chordDetector feature is enabled
        mode.variations.map((variation) => {
          // if (chord.note === Note.A && mode.mode === ChordMode.Minor) {
          //   debugger;
          // }
          addChordToLookup(variation, fullKey);
        });
        if (closestVariation) {
          chordsMap.set(fullKey, closestVariation);
        }
      }
    }
  }
};

const toggleInterval = (toggle: boolean) => {
  if (toggle) {
    // starting time-based activity
    if (!isMainClockTicking()) {
      console.log("Clock not ticking - starting it");
      startInterval();
    }
  } else {
    // stopping clock is nothing is playing
    if (
      !isMetronomeTickingValue &&
      strummingChordsMap.size === 0 &&
      !isPlayingValue
    ) {
      console.log("Nothing playing - stopping clock");
      stopInterval(true);
    }
  }
};

export const settingsSlice = createSlice({
  name: "settings",
  initialState,
  reducers: {
    init: (state) => {
      onGuitarSettingsUpdate(state);
      // update initial settings after they got loaded from redux persist
      velocityValue = state.velocity;
      metronomeVelocityValue = state.metronomeVelocity;
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
      isMetronomeTickingValue = state.isMetronomeTicking;
      chordStrummingDelayMsValue = state.chordStrummingDelayMs;
      chordIsBeingDetectedValue = state.chordIsBeingDetected;
      chordPlayModeValue = state.chordPlayMode;
      chordNotesToPlayValue = state.chordNotesToPlay;
      isPlayingValue = state.isPlaying;
      loadInstrument(instrumentValue, reverbStrengthValue);
      loadInstrument(chordInstrumentValue, reverbStrengthValue);
      loadMetronome();
    },
    setScaleGroup: (state, action: PayloadAction<string>) => {
      state.scaleGroup = action.payload;
      state.scale = getFirstScaleForGroup(action.payload);
      onGuitarSettingsUpdate(state);
    },
    setScale: (state, action: PayloadAction<string>) => {
      state.scale = action.payload;
      onGuitarSettingsUpdate(state);
    },
    setBaseNote: (state, action: PayloadAction<Note>) => {
      state.baseNote = action.payload;
      onGuitarSettingsUpdate(state);
    },
    setTuning(state, action: PayloadAction<Tuning>) {
      state.tuning = action.payload;
      onGuitarSettingsUpdate(state);
    },
    setTempoBpm: (state, action: PayloadAction<number>) => {
      if (tempoBpmValue === action.payload) {
        return;
      }
      state.tempoBpm = action.payload;
      tempoBpmValue = action.payload;
      stopInterval(false);
      startInterval(false); // afresh is set to false to maintain current tick/beat position
    },
    setChordStrummingDelayMs(state, action: PayloadAction<number>) {
      state.chordStrummingDelayMs = action.payload;
      chordStrummingDelayMsValue = action.payload;
    },
    setVelocity: (state, action: PayloadAction<number>) => {
      state.velocity = action.payload;
      velocityValue = action.payload;
    },
    setMetronomeVelocity: (state, action: PayloadAction<number>) => {
      state.metronomeVelocity = action.payload;
      metronomeVelocityValue = action.payload;
    },
    setPlaybackType(state, action: PayloadAction<PlaybackType>) {
      state.playbackType = action.payload;
    },
    setSwitchToChromaticScale(state, action: PayloadAction<boolean>) {
      state.switchToChromaticScale = action.payload;
    },
    setUseAdvancedChords(state, action: PayloadAction<boolean>) {
      state.useAdvancedChords = action.payload;
    },
    setUseSharpChords(state, action: PayloadAction<boolean>) {
      state.useSharpChords = action.payload;
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
    setIsMetronomeTicking(state, action: PayloadAction<boolean>) {
      state.isMetronomeTicking = action.payload;
      isMetronomeTickingValue = action.payload;
      toggleInterval(action.payload);
    },
    setIsPlaying(state, action: PayloadAction<boolean>) {
      state.isPlaying = action.payload;
      isPlayingValue = action.payload;
      toggleInterval(action.payload);
    },
    setChordIsBeingDetected(state, action: PayloadAction<boolean>) {
      state.chordIsBeingDetected = action.payload;
      chordIsBeingDetectedValue = action.payload;
    },
  },
});

export const {
  init,
  setScale,
  setScaleGroup,
  setBaseNote,
  setTempoBpm,
  setVelocity,
  setMetronomeVelocity,
  setPlaybackType,
  setSwitchToChromaticScale,
  setUseAdvancedChords,
  setUseSharpChords,
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
  setIsMetronomeTicking,
  setIsPlaying,
  setChordIsBeingDetected,
} = settingsSlice.actions;

export const selectSettings = (state: RootState) => state.settings;

export default settingsSlice.reducer;
