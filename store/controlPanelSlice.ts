// controlPanelSlice.ts
import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { Note, OctaveNote } from "../data/notes";
import { scalesMap } from "../data/scales";
import { ShowNoteMode } from "../data/showNoteMode";
import { Neck } from "../engine/generateNeckRepresentation";
import { RootState } from "./store"; // Define RootState type

interface ControlPanelState {
  selectedScale: string;
  selectedBaseNote: Note;
  selectedShowNoteMode: ShowNoteMode;
  neck: Neck | null;
  noteToAnimate?: OctaveNote;
}

const initialState: ControlPanelState = {
  selectedScale: scalesMap.keys().next().value,
  selectedBaseNote: Note.E,
  selectedShowNoteMode: ShowNoteMode.Fret,
  neck: null,
};

export const controlPanelSlice = createSlice({
  name: "controlPanel",
  initialState,
  reducers: {
    setSelectedScale: (state, action: PayloadAction<string>) => {
      state.selectedScale = action.payload;
    },
    setSelectedBaseNote: (state, action: PayloadAction<Note>) => {
      state.selectedBaseNote = action.payload;
    },
    setSelectedShowNoteMode: (state, action: PayloadAction<ShowNoteMode>) => {
      state.selectedShowNoteMode = action.payload;
    },
    setNeck: (state, action: PayloadAction<Neck>) => {
      state.neck = action.payload;
    },
    setNoteToAnimate: (state, action: PayloadAction<OctaveNote>) => {
      state.noteToAnimate = action.payload;
    },
  },
});

export const {
  setSelectedScale,
  setSelectedBaseNote,
  setSelectedShowNoteMode,
  setNoteToAnimate,
  setNeck,
} = controlPanelSlice.actions;

export const selectControlPanel = (state: RootState) => state.controlPanel;

export default controlPanelSlice.reducer;
