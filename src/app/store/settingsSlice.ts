import { ChordPlayMode } from "@/app/data/chordPlayMode";
import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { ChordStrummingInterval } from "../data/chordStrummingInterval";
import { chordStrummingPatterns } from "../data/chordStrummingPatterns";
import { Instrument, InstrumentGroup } from "../data/instruments";
import { Chord, getNoteText, MAX_VELOCITY, Note } from "../data/notes";
import { PlaybackType } from "../data/playbackType";
import { scalesMap } from "../data/scales";
import { getShiftedNote, parseStringToNotes, Tuning } from "../data/tunings";
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
  isMainClockActive,
  startInterval,
  stopInterval,
} from "../engine/mainClock";
import { loadMetronome } from "../engine/sound/metronomeProvider";
import { loadInstrument } from "../engine/sound/soundHelper";
import { strummingChordsMap } from "../engine/strummingState";
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
  isMetronomeActive: boolean;
  isPlaying: boolean;
  chordIsBeingDetected: boolean;
  isRecording: boolean;
  toggleMetronomeWhenRecording: boolean;
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
  chordIsBeingDetected: false,
  isRecording: false,
  toggleMetronomeWhenRecording: true,
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
export let isMetronomeActiveValue = initialState.isMetronomeActive;
export let isPlayingValue: boolean = initialState.isPlaying;
export let chordStrummingDelayMsValue: number =
  initialState.chordStrummingDelayMs;
export let chordIsBeingDetectedValue: boolean =
  initialState.chordIsBeingDetected;
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

export let chordsMap = new Map<string, Chord>();

const onGuitarSettingsUpdate = (state: WithControls & WithNeck) => {
  const scaleNotes = scalesMap.get(state.scaleGroup)!.get(state.scale);
  const scalePattern = new Set(scaleNotes?.concat([0]));

  // Just for debug
  // checkDuplicateScales(scalesMap);
  const neck = generateNeckRepresentation(
    scalePattern,
    parseStringToNotes(tuningValue),
    getShiftedNote(state.baseNote)
  );
  state.neck = neck;
  setChords(state);
  clearPreviousChords();
};

export const setChordDetectorFunctions = (
  addChord: (chord: Chord, fullKey: string) => void,
  createLookup: () => void
) => {
  addChordToDetectorLookup = addChord;
  createChordDetectorLookup = createLookup;
};

let addChordToDetectorLookup:
  | ((chord: Chord, fullKey: string) => void)
  | undefined;
let createChordDetectorLookup: (() => void) | undefined;

const setChords = (state: WithNeck) => {
  if (state.neck) {
    // Passing true for useAdvancedChords to generate them all (in order to play in examples). But the user can show them only being premium
    const chordsForNeck = generateAllChords(state.neck, true, state.baseNote);
    state.chords = chordsForNeck;

    createChordDetectorLookup?.();
    chordsMap = new Map<string, Chord>(); // name to chord (notes)
    for (const chord of chordsForNeck) {
      const key = getNoteText(chord.note);
      for (const mode of chord.modes) {
        const modeKey = getModeText(mode.mode);
        const fullKey = key + modeKey;
        const closestVariation = getClosestVariation(mode);
        mode.variations.map((variation) => {
          // if (chord.note === Note.A && mode.mode === ChordMode.Minor) {
          //   debugger;
          // }
          addChordToDetectorLookup?.(variation, fullKey);
        });
        if (closestVariation) {
          chordsMap.set(fullKey, closestVariation);
        }
      }
    }
  }
};

export const isAnyTimerSpecificActivityRunning = () =>
  isMetronomeActiveValue ||
  strummingChordsMap.size > 0 ||
  isPlayingValue ||
  isRecordingValue;

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
      isMetronomeActiveValue = state.isMetronomeActive;
      chordStrummingDelayMsValue = state.chordStrummingDelayMs;
      chordIsBeingDetectedValue = state.chordIsBeingDetected;
      chordPlayModeValue = state.chordPlayMode;
      chordNotesToPlayValue = state.chordNotesToPlay;
      isPlayingValue = state.isPlaying;
      scaleGroupValue = state.scaleGroup;
      scaleValue = state.scale;
      baseNoteValue = state.baseNote;
      isRecordingValue = state.isRecording;
      playbackTypeValue = state.playbackType;
      tuningValue = state.tuning;
      toggleMetronomeWhenRecordingValue = state.toggleMetronomeWhenRecording;
      void loadInstrument(instrumentValue, reverbStrengthValue);
      void loadInstrument(chordInstrumentValue, reverbStrengthValue);
      void loadMetronome();
    },
    refreshSettings: (state) => {
      onGuitarSettingsUpdate(state);
    },
    setScaleGroup: (state, action: PayloadAction<string>) => {
      state.scaleGroup = action.payload;
      state.scale = getFirstScaleForGroup(action.payload);
      onGuitarSettingsUpdate(state);
      scaleGroupValue = state.scaleGroup;
      scaleValue = state.scale;
    },
    setScale: (state, action: PayloadAction<string>) => {
      state.scale = action.payload;
      onGuitarSettingsUpdate(state);
      scaleValue = state.scale;
    },
    setBaseNote: (state, action: PayloadAction<Note>) => {
      state.baseNote = action.payload;
      onGuitarSettingsUpdate(state);
      baseNoteValue = action.payload;
    },
    setTuning(state, action: PayloadAction<Tuning>) {
      state.tuning = action.payload;
      tuningValue = action.payload;
      onGuitarSettingsUpdate(state);
    },
    setTempoBpm: (
      state,
      action: PayloadAction<{ tempo: number; updateInteval: boolean }>
    ) => {
      if (tempoBpmValue === action.payload.tempo) {
        return;
      }
      state.tempoBpm = action.payload.tempo;
      tempoBpmValue = action.payload.tempo;

      if (action.payload.updateInteval) {
        stopInterval(false);
        startInterval(false); // afresh is set to false to maintain current beat/bar position
      }
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
      state.isMetronomeActive = action.payload;
      isMetronomeActiveValue = action.payload;
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
    setToggleMetronomeWhenRecording(state, action: PayloadAction<boolean>) {
      state.toggleMetronomeWhenRecording = action.payload;
      toggleMetronomeWhenRecordingValue = action.payload;
    },
    setIsRecording(state, action: PayloadAction<boolean>) {
      state.isRecording = action.payload;
      isRecordingValue = action.payload;
      toggleInterval(action.payload);
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
  setChordIsBeingDetected,
  setIsRecording,
  setToggleMetronomeWhenRecording,
  refreshSettings,
} = settingsSlice.actions;

export const selectSettings = (state: RootState) => state.settings;

export default settingsSlice.reducer;
