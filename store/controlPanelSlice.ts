// controlPanelSlice.ts
import { createSlice, PayloadAction } from "@reduxjs/toolkit";
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

interface ControlPanelState {
  selectedScale: string;
  selectedScaleGroup: string;
  selectedBaseNote: Note;
  selectedNoteDisplayMode: NoteDisplayMode;
  neck: Neck | null;
  settingsExpanded: boolean;
  playIntervalBpm: number;
  velocity: number;
  showAlert: boolean;
  alertMessage: string;
  playbackType: PlaybackType;
  theme: Theme;
}

const firstScaleGroupKey = scalesMap.keys().next().value;

const getFirstScaleForGroup = (groupKey: string) =>
  scalesMap.get(groupKey)!.keys().next().value;

const firstScaleKey = getFirstScaleForGroup(firstScaleGroupKey);

const initialState: ControlPanelState = {
  selectedScaleGroup: firstScaleGroupKey,
  selectedScale: firstScaleKey,
  selectedBaseNote: Note.E,
  selectedNoteDisplayMode: NoteDisplayMode.Fret,
  neck: null,
  settingsExpanded: false,
  playIntervalBpm: 120,
  velocity: 125,
  showAlert: false,
  alertMessage: "",
  playbackType: PlaybackType.Melody,
  theme: Theme.MatchOS,
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
    setNeck: (state, action: PayloadAction<Neck>) => {
      state.neck = action.payload;
    },
    setSettingsExpanded: (state, action: PayloadAction<boolean>) => {
      state.settingsExpanded = action.payload;
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
      state.theme = action.payload;
    },
  },
});

export const {
  setSelectedScale,
  setSelectedScaleGroup,
  setSelectedBaseNote,
  setSelectedNoteDisplayMode,
  setNeck,
  setSettingsExpanded,
  setPlayIntervalBpm,
  setVelocity,
  showAlert,
  hideAlert,
  setPlaybackType,
  setTheme,
} = controlPanelSlice.actions;

export const selectControlPanel = (state: RootState) => state.controlPanel;

export default controlPanelSlice.reducer;
