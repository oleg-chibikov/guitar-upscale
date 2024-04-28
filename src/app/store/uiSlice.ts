import { Skin } from "@/app/data/skin";
import { Theme } from "@/app/data/theme";
import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { ChordsDisplayMode } from "../data/chordsDisplayMode";
import { NoteDisplayMode } from "../data/noteDisplayMode";
import { RootState } from "./store"; // Define RootState type

const initialTheme = Theme.Dark;

export const minXZoom = 1;
export const maxXZoom = 3;
export const minYZoom = 0.7;
export const maxYZoom = 1;

interface UiState {
  noteDisplayMode: NoteDisplayMode;
  chordsDisplayMode: ChordsDisplayMode;
  skin: Skin;
  settingsExpanded: boolean;
  chordsExpanded: boolean;
  showAlert: boolean;
  alertIsError: boolean;
  alertMessage: string;
  theme: Theme;
  fretboardScaleX: number;
  fretboardScaleY: number;
  lockRatio: boolean;
  strummingSettingsExpanded: boolean;
}

const initialState: UiState = {
  noteDisplayMode: NoteDisplayMode.Fret,
  chordsDisplayMode: ChordsDisplayMode.Left,
  skin: Skin.Yamaha_SLG200NW,
  settingsExpanded: false,
  chordsExpanded: true,
  showAlert: false,
  alertIsError: false,
  alertMessage: "",
  theme: initialTheme,
  fretboardScaleX: 1,
  fretboardScaleY: 1,
  lockRatio: false,
  strummingSettingsExpanded: false,
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

export const uiSlice = createSlice({
  name: "ui",
  initialState,
  reducers: {
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
    setAndShowAlert(
      state,
      action: PayloadAction<{ message: string; isError?: boolean }>
    ) {
      state.showAlert = true;
      state.alertMessage = action.payload.message;
      state.alertIsError = action.payload.isError ?? false;
    },
    hideAlert(state) {
      state.showAlert = false;
    },
    setTheme(state, action: PayloadAction<Theme>) {
      state.theme = action.payload;
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
    setStrummingSettingsExpanded(state, action: PayloadAction<boolean>) {
      state.strummingSettingsExpanded = action.payload;
    },
  },
});

export const {
  setNoteDisplayMode,
  setChordsDisplayMode,
  setSkin,
  setSettingsExpanded,
  setAndShowAlert,
  hideAlert,
  setTheme,
  setChordsExpanded,
  setFretboardScaleX,
  setFretboardScaleY,
  setLockRatio,
  setStrummingSettingsExpanded,
} = uiSlice.actions;

export const selectUi = (state: RootState) => state.ui;

export default uiSlice.reducer;
