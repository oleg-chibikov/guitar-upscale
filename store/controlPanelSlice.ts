// controlPanelSlice.ts
import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { Appearance } from "react-native";
import { NoteDisplayMode } from "../data/noteDisplayMode";
import { Note } from "../data/notes";
import { Example, scalesMap } from "../data/scales";
import { Neck } from "../engine/generateNeckRepresentation";
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

interface ControlPanelState {
  selectedScale: string;
  selectedScaleGroup: string;
  selectedBaseNote: Note;
  selectedNoteDisplayMode: NoteDisplayMode;
  selectedSkin: Skin;
  neck: Neck | null;
  settingsExpanded: boolean;
  chordsExpanded: boolean;
  playIntervalBpm: number;
  velocity: number;
  showAlert: boolean;
  alertMessage: string;
  playbackType: PlaybackType;
  theme: Theme;
  switchToChromaticScale: boolean;
  matchFullChord: boolean;
  useAdvancedChords: boolean;
}

const firstScaleGroupKey = scalesMap.keys().next().value;

const getFirstScaleForGroup = (groupKey: string) =>
  scalesMap.get(groupKey)!.keys().next().value;

const firstScaleKey = getFirstScaleForGroup(firstScaleGroupKey);
const getTheme = (theme: Theme) => {
  let tempTheme = theme;
  if (tempTheme === Theme.MatchOS) {
    tempTheme =
      Appearance.getColorScheme() === "dark" ? Theme.Dark : Theme.Light;
  }
  return tempTheme;
};

const initialState: ControlPanelState = {
  selectedScaleGroup: firstScaleGroupKey,
  selectedScale: firstScaleKey,
  selectedBaseNote: Note.E,
  selectedNoteDisplayMode: NoteDisplayMode.Fret,
  selectedSkin: Skin.Yamaha_SLG200NW,
  neck: null,
  settingsExpanded: false,
  chordsExpanded: true,
  playIntervalBpm: 120,
  velocity: 125,
  showAlert: false,
  alertMessage: "",
  playbackType: PlaybackType.Melody,
  theme: getTheme(Theme.MatchOS),
  switchToChromaticScale: false,
  matchFullChord: true,
  useAdvancedChords: false,
};

// A value that changes immediately without the need for rerender
export let playIntervalBpmValue: number | undefined = undefined;
export let velocityValue: number | undefined = undefined;
export let examplesForScale: Example[] | undefined = undefined;
export const setExamples = (examples?: Example[]) => {
  examplesForScale = examples;
};

export const controlPanelSlice = createSlice({
  name: "controlPanel",
  initialState,
  reducers: {
    setSelectedScaleGroup: (state, action: PayloadAction<string>) => {
      state.selectedScaleGroup = action.payload;
      state.selectedScale = getFirstScaleForGroup(action.payload);
    },
    setSelectedScale: (state, action: PayloadAction<string>) => {
      state.selectedScale = action.payload;
    },
    setSelectedBaseNote: (state, action: PayloadAction<Note>) => {
      state.selectedBaseNote = action.payload;
    },
    setSelectedNoteDisplayMode: (
      state,
      action: PayloadAction<NoteDisplayMode>
    ) => {
      state.selectedNoteDisplayMode = action.payload;
    },
    setSelectedSkin(state, action: PayloadAction<Skin>) {
      state.selectedSkin = action.payload;
    },
    setNeck: (state, action: PayloadAction<Neck>) => {
      state.neck = action.payload;
    },
    setSettingsExpanded: (state, action: PayloadAction<boolean>) => {
      state.settingsExpanded = action.payload;
    },
    setChordsExpanded: (state, action: PayloadAction<boolean>) => {
      state.chordsExpanded = action.payload;
    },
    setPlayIntervalBpm: (state, action: PayloadAction<number>) => {
      state.playIntervalBpm = action.payload;
      playIntervalBpmValue = action.payload;
    },
    setVelocity: (state, action: PayloadAction<number>) => {
      state.velocity = action.payload;
      velocityValue = action.payload;
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
      state.theme = getTheme(action.payload);
    },
    setSwitchToChromaticScale(state, action: PayloadAction<boolean>) {
      state.switchToChromaticScale = action.payload;
    },
    setMatchFullChord(state, action: PayloadAction<boolean>) {
      state.matchFullChord = action.payload;
    },
    setUseAdvancedChords(state, action: PayloadAction<boolean>) {
      state.useAdvancedChords = action.payload;
    },
  },
});

export const {
  setSelectedScale,
  setSelectedScaleGroup,
  setSelectedBaseNote,
  setSelectedNoteDisplayMode,
  setSelectedSkin,
  setNeck,
  setSettingsExpanded,
  setPlayIntervalBpm,
  setVelocity,
  showAlert,
  hideAlert,
  setPlaybackType,
  setTheme,
  setChordsExpanded,
  setSwitchToChromaticScale,
  setMatchFullChord,
  setUseAdvancedChords,
} = controlPanelSlice.actions;

export const selectControlPanel = (state: RootState) => state.controlPanel;

export default controlPanelSlice.reducer;
