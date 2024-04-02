// controlPanelSlice.js
import { createSlice } from "@reduxjs/toolkit";

export const controlPanelSlice = createSlice({
  name: "controlPanel",
  initialState: {
    selectedScale: "",
    selectedBaseNote: null,
    selectedShowNoteMode: null,
    neck: null,
  },
  reducers: {
    setSelectedScale: (state, action) => {
      state.selectedScale = action.payload;
    },
    setSelectedBaseNote: (state, action) => {
      state.selectedBaseNote = action.payload;
    },
    setSelectedShowNoteMode: (state, action) => {
      state.selectedShowNoteMode = action.payload;
    },
    setNeck: (state, action) => {
      state.neck = action.payload;
    },
  },
});

export const {
  setSelectedScale,
  setSelectedBaseNote,
  setSelectedShowNoteMode,
  setNeck,
} = controlPanelSlice.actions;

export default controlPanelSlice.reducer;
