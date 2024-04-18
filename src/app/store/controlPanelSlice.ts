// controlPanelSlice.ts
import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { ChordPlayMode } from "../data/chordPlayMode";
import { ChordsDisplayMode } from "../data/chordsDisplayMode";
import { NoteDisplayMode } from "../data/noteDisplayMode";
import {
  Chord,
  getNoteText,
  MAX_VELOCITY,
  Note,
  parseStringToNotes,
  tunings,
} from "../data/notes";
import {
  Example,
  getScaleExamples,
  getScaleNotes,
  scalesMap,
} from "../data/scales";
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
import { midiRecorder } from "../engine/midiRecorder";
import { RootState } from "./store"; // Define RootState type

export enum Theme {
  Dark,
  Light,
  MatchOS,
}

export enum PlaybackType {
  Melody,
  Scale,
  FullStringScale,
}

export enum Skin {
  PRS_SE_AX20E,
  Ibanez_AE140_WKH,
  Yamaha_CSF3M,
  Yamaha_SLG200NW,
}

const getFirstScaleForGroup = (groupKey: string) =>
  scalesMap.get(groupKey)!.keys().next().value;

const initialTheme = Theme.Dark;

export const minXZoom = 1;
export const maxXZoom = 3;
export const minYZoom = 0.7;
export const maxYZoom = 1;

interface WithNeck {
  neck: Neck | null;
  chords: NoteChords[] | null;
  chordsMap: Map<string, Chord> | null;
}

interface WithControls {
  scaleGroup: string;
  scale: string;
  baseNote: Note;
  tuning: string;
}

interface ControlPanelState extends WithNeck, WithControls {
  isSignedIn: boolean;
  signInCheckCount: number;
  noteDisplayMode: NoteDisplayMode;
  chordsDisplayMode: ChordsDisplayMode;
  skin: Skin;
  settingsExpanded: boolean;
  isRecording: boolean;
  chordsExpanded: boolean;
  tempoBpm: number;
  chordStrummingDelayMs: number;
  velocity: number;
  metronomeVelocity: number;
  showAlert: boolean;
  alertMessage: string;
  playbackType: PlaybackType;
  theme: Theme;
  switchToChromaticScale: boolean;
  useAdvancedChords: boolean;
  chordPlayMode: ChordPlayMode;
  fretboardScaleX: number;
  fretboardScaleY: number;
  lockRatio: boolean;
  chordNotesToPlay: number;
  tuning: string;
}

const initialState: ControlPanelState = {
  isSignedIn: false,
  signInCheckCount: 0,
  scaleGroup: "Special",
  scale: "Chromatic (All notes)",
  baseNote: Note.E,
  noteDisplayMode: NoteDisplayMode.Fret,
  chordsDisplayMode: ChordsDisplayMode.Left,
  skin: Skin.Yamaha_SLG200NW,
  neck: null,
  chords: null,
  chordsMap: null,
  settingsExpanded: false,
  isRecording: false,
  chordsExpanded: true,
  tempoBpm: 140,
  chordStrummingDelayMs: 20,
  velocity: MAX_VELOCITY,
  metronomeVelocity: MAX_VELOCITY,
  showAlert: false,
  alertMessage: "",
  playbackType: PlaybackType.Melody,
  theme: initialTheme,
  switchToChromaticScale: true,
  useAdvancedChords: false,
  chordPlayMode: ChordPlayMode.RoundRobin,
  fretboardScaleX: 1,
  fretboardScaleY: 1,
  lockRatio: false,
  chordNotesToPlay: 6,
  tuning: tunings[0],
};

// A value that changes immediately without the need for rerender
export let velocityValue: number | undefined = undefined;
export let metronomeVelocityValue: number | undefined = undefined;
export let examplesForScale: Example[] | undefined = undefined;
export let isMetronomeTicking = false;

export const setMetronomeTicking = (value: boolean) => {
  isMetronomeTicking = value;
};

export const setExamples = (examples?: Example[]) => {
  examplesForScale = examples;
};

const onGuitarSettingsUpdate = (state: WithControls & WithNeck) => {
  const scaleObject = scalesMap.get(state.scaleGroup)!.get(state.scale);
  setExamples(getScaleExamples(scaleObject));
  let scaleNotes = getScaleNotes(scaleObject);
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

const calculatePercentage = (
  minimum: number,
  maximum: number,
  currentPosition: number
): number => {
  const percentage: number =
    ((currentPosition - minimum) / (maximum - minimum)) * 100;
  return percentage;
};

const getValueFromPercentage = (
  minimum: number,
  maximum: number,
  percentage: number
): number => {
  const range = maximum - minimum;
  const valueInRange = (percentage / 100) * range + minimum;
  return valueInRange;
};

export const controlPanelSlice = createSlice({
  name: "controlPanel",
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
    setTuning(state, action: PayloadAction<string>) {
      state.tuning = action.payload;
      onGuitarSettingsUpdate(state);
    },
    setNoteDisplayMode: (state, action: PayloadAction<NoteDisplayMode>) => {
      state.noteDisplayMode = action.payload;
    },
    setChordsDisplayMode: (state, action: PayloadAction<ChordsDisplayMode>) => {
      state.chordsDisplayMode = action.payload;
    },
    setSkin(state, action: PayloadAction<Skin>) {
      state.skin = action.payload;
    },
    setSettingsExpanded: (state, action: PayloadAction<boolean>) => {
      state.settingsExpanded = action.payload;
    },
    setChordsExpanded: (state, action: PayloadAction<boolean>) => {
      state.chordsExpanded = action.payload;
    },
    toggleRecording(state, action: PayloadAction<boolean>) {
      if (!state.isRecording) {
        state.isRecording = true;
        midiRecorder.startRecording();
      } else {
        state.isRecording = false;
        midiRecorder.stopRecording(action.payload);
      }
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
    showAlert(state, action: PayloadAction<string>) {
      state.showAlert = true;
      state.alertMessage = action.payload;
    },
    hideAlert(state) {
      state.showAlert = false;
      state.alertMessage = "";
    },
    setPlaybackType(state, action: PayloadAction<PlaybackType>) {
      state.playbackType = action.payload;
    },
    setTheme(state, action: PayloadAction<Theme>) {
      state.theme = action.payload;
    },
    setSwitchToChromaticScale(state, action: PayloadAction<boolean>) {
      state.switchToChromaticScale = action.payload;
    },
    setUseAdvancedChords(state, action: PayloadAction<boolean>) {
      state.useAdvancedChords = action.payload;
    },
    setChordPlayMode(state, action: PayloadAction<ChordPlayMode>) {
      state.chordPlayMode = action.payload;
    },
    setFretboardScaleX(state, action: PayloadAction<number>) {
      state.fretboardScaleX = action.payload;
      if (state.lockRatio) {
        const relativePosition = calculatePercentage(
          minXZoom,
          maxXZoom,
          action.payload
        );
        state.fretboardScaleY = getValueFromPercentage(
          minYZoom,
          maxYZoom,
          100 - relativePosition
        );
      }
    },
    setFretboardScaleY(state, action: PayloadAction<number>) {
      state.fretboardScaleY = action.payload;
      if (state.lockRatio) {
        const relativePosition = calculatePercentage(
          minYZoom,
          maxYZoom,
          action.payload
        );
        state.fretboardScaleX = getValueFromPercentage(
          minXZoom,
          maxXZoom,
          100 - relativePosition
        );
      }
    },
    setLockRatio(state, action: PayloadAction<boolean>) {
      state.lockRatio = action.payload;
      if (state.lockRatio) {
        const relativePositionY = calculatePercentage(
          minYZoom,
          maxYZoom,
          state.fretboardScaleY
        );
        state.fretboardScaleX = getValueFromPercentage(
          minXZoom,
          maxXZoom,
          100 - relativePositionY
        );
      }
    },
    setChordNotesToPlay(state, action: PayloadAction<number>) {
      state.chordNotesToPlay = action.payload;
    },
    setIsSignedIn(state, action: PayloadAction<boolean>) {
      state.isSignedIn = action.payload;
    },
    setSignedInCheckCount(state, action: PayloadAction<number>) {
      state.signInCheckCount = action.payload;
    },
  },
});

export const {
  init,
  setScale,
  setScaleGroup,
  setBaseNote,
  setNoteDisplayMode,
  setChordsDisplayMode,
  setSkin,
  setSettingsExpanded,
  setTempoBpm,
  setVelocity,
  setMetronomeVelocity,
  showAlert,
  hideAlert,
  setPlaybackType,
  setTheme,
  setChordsExpanded,
  setSwitchToChromaticScale,
  setUseAdvancedChords,
  setChordStrummingDelayMs,
  setChordPlayMode,
  toggleRecording,
  setFretboardScaleX,
  setFretboardScaleY,
  setLockRatio,
  setChordNotesToPlay,
  setTuning,
  setIsSignedIn,
  setSignedInCheckCount,
} = controlPanelSlice.actions;

export const selectControlPanel = (state: RootState) => state.controlPanel;

export default controlPanelSlice.reducer;
