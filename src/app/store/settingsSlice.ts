import { ChordPlayMode } from "@/app/data/chordPlayMode";
import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import {
  Instrument,
  InstrumentGroup,
  instrumentGroups,
} from "../data/instruments";
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
  instrument: Instrument;
  instrumentGroup: InstrumentGroup;
  reverbStrength: number;
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
  chordPlayMode: ChordPlayMode.ClosestVariation,
  chordNotesToPlay: 6,
  tuning: "EBGDAE",
  instrument: "acoustic_guitar_nylon",
  instrumentGroup: "Guitar",
  reverbStrength: 0.2,
};

// A value that changes immediately without the need for rerender
export let velocityValue: number | undefined = undefined;
export let metronomeVelocityValue: number | undefined = undefined;
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
      velocityValue = state.velocity;
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
    },
    setInstrumentGroup: (state, action: PayloadAction<InstrumentGroup>) => {
      // TODO: lazy load instruments.ts if permissions allow
      const group = action.payload;
      state.instrumentGroup = group;
      // Select the first instrument from the group
      const instrumentsInGroup = instrumentGroups[group];
      if (instrumentsInGroup && instrumentsInGroup.length > 0) {
        state.instrument = instrumentsInGroup[0];
      }
    },
    setReverbStrength(state, action: PayloadAction<number>) {
      state.reverbStrength = action.payload;
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
  setReverbStrength,
} = settingsSlice.actions;

export const selectSettings = (state: RootState) => state.settings;

export default settingsSlice.reducer;
