// controlPanelSlice.ts
import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { NoteDisplayMode } from "../data/noteDisplayMode";
import { Note } from "../data/notes";
import { scalesMap } from "../data/scales";
import { Neck } from "../engine/generateNeckRepresentation";
import { RootState } from "./store"; // Define RootState type

interface ControlPanelState {
  selectedScale: string;
  selectedScaleGroup: string;
  selectedBaseNote: Note;
  selectedNoteDisplayMode: NoteDisplayMode;
  neck: Neck | null;
  settingsExpanded: boolean;
  playIntervalMs: number;
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
  playIntervalMs: 100,
};

// A value that changes immediately without the need for rerender
export let playIntervalMsValue: number | undefined = undefined;
export let examplesForScale: string[] | undefined = undefined;
export const setExamples = (examples?: string[]) => {
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
    setPlayIntervalMs: (state, action: PayloadAction<number>) => {
      state.playIntervalMs = action.payload;
      playIntervalMsValue = action.payload;
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
  setPlayIntervalMs,
} = controlPanelSlice.actions;

export const selectControlPanel = (state: RootState) => state.controlPanel;

export default controlPanelSlice.reducer;
