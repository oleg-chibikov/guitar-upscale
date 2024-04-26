import { ChordPlayMode } from "@/app/data/chordPlayMode";
import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { ChordStrummingMode } from "../data/chordStrummingMode";
import { chordStrummingPatterns } from "../data/chordStrummingPatterns";
import { Instrument, InstrumentGroup } from "../data/instruments";
import { Chord, getNoteText, MAX_VELOCITY, Note } from "../data/notes";
import { PlaybackType } from "../data/playbackType";
import { scalesMap } from "../data/scales";
import { parseStringToNotes, Tuning } from "../data/tunings";
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
import { setBpm } from "../engine/mainClock";
import { RootState } from "./store"; // Define RootState type

const getFirstScaleForGroup = (groupKey: string) =>
  scalesMap.get(groupKey)!.keys().next().value;

interface WithNeck {
  neck: Neck | null;
  chords: NoteChords[] | null;
  chordsMap: Map<string, Chord> | null;
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
  chordStrummingMode: ChordStrummingMode;
  useChordAlteration: boolean;
  chordCustomStrummingPattern: string;
  chordCustomStrummingWaitForPatternFinish: boolean;
}

const initialState: SettingsState = {
  scaleGroup: "Common Minor",
  scale: "Aeolian / Natural",
  baseNote: Note.E,
  neck: null,
  chords: null,
  chordsMap: null,
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
  chordStrummingMode: ChordStrummingMode.QuarterBeat,
  useChordAlteration: false,
  chordCustomStrummingPattern: chordStrummingPatterns[0],
  chordCustomStrummingWaitForPatternFinish: true,
};

// A values that changes immediately without the need for rerender
// Consider them as a global refs
export let velocityValue: number = initialState.velocity;
export let metronomeVelocityValue: number = initialState.metronomeVelocity;
export let tempoBpmValue: number = initialState.tempoBpm;
export let instrumentValue: Instrument = initialState.instrument;
export let chordInstrumentValue: Instrument = initialState.chordInstrument;
export let reverbStrengthValue: number = initialState.reverbStrength;
export let chordStrummingModeValue: ChordStrummingMode =
  initialState.chordStrummingMode;
export let useChordAlterationValue: boolean = initialState.useChordAlteration;
export let chordCustomStrummingPatternValue: string =
  initialState.chordCustomStrummingPattern;
export let chordCustomStrummingWaitForPatternFinishValue: boolean =
  initialState.chordCustomStrummingWaitForPatternFinish;
export let isMetronomeTicking = false;

export const setMetronomeTicking = (value: boolean) => {
  isMetronomeTicking = value;
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
    const chordsForNeck = generateAllChords(state.neck, true);
    state.chords = chordsForNeck;
    const map = new Map<string, Chord>();
    state.chordsMap = new Map();
    for (const chord of chordsForNeck) {
      const key = getNoteText(chord.note);
      for (const mode of chord.modes) {
        const modeKey = getModeText(mode.mode);
        const fullKey = key + modeKey;
        const closestVariation = getClosestVariation(mode);
        if (closestVariation) {
          map.set(fullKey, closestVariation);
        }
      }
    }
    state.chordsMap = map;
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
      chordStrummingModeValue = state.chordStrummingMode;
      useChordAlterationValue = state.useChordAlteration;
      chordCustomStrummingPatternValue = state.chordCustomStrummingPattern;
      chordCustomStrummingWaitForPatternFinishValue =
        state.chordCustomStrummingWaitForPatternFinish;
      setBpm(state.tempoBpm);
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
      state.tempoBpm = action.payload;
      tempoBpmValue = action.payload;
      setBpm(action.payload);
    },
    setChordStrummingDelayMs(state, action: PayloadAction<number>) {
      state.chordStrummingDelayMs = action.payload;
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
    },
    setChordNotesToPlay(state, action: PayloadAction<number>) {
      state.chordNotesToPlay = action.payload;
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
    setChordStrummingMode(state, action: PayloadAction<ChordStrummingMode>) {
      state.chordStrummingMode = action.payload;
      chordStrummingModeValue = action.payload;
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
  setChordStrummingMode,
  setUseChordAlteration,
  setChordCustomStrummingPattern,
  setChordCustomStrummingWaitForPatternFinish,
} = settingsSlice.actions;

export const selectSettings = (state: RootState) => state.settings;

export default settingsSlice.reducer;
