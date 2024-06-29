import { AlertType } from "@/app/data/alertType";
import { Skin } from "@/app/data/skin";
import { Theme } from "@/app/data/theme";
import { ScaleAndGroup } from "@/app/engine/scales/scaleLookupBuilder";
import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { ChordsDisplayMode } from "../data/chordsDisplayMode";
import { NoteDisplayMode } from "../data/noteDisplayMode";
import { RootState } from "./store"; // Define RootState type

const initialTheme = Theme.MatchOS;

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
  controlPanelExpanded: boolean;
  strummingSettingsExpanded: boolean;
  strummingPatternEditorExpanded: boolean;
  showAlert: boolean;
  alertType: AlertType;
  alertTimeout: number;
  alertMessage: string;
  suggestedScales: ScaleAndGroup[] | undefined;
  showScalesAlert: boolean;
  theme: Theme;
  fretboardScaleX: number;
  fretboardScaleY: number;
  lockRatio: boolean;
  useAdvancedChords: boolean;
  useSharpChords: boolean;
  loadingMessage?: string;
  showAspectRatio: boolean;
}

const initialState: UiState = {
  noteDisplayMode: NoteDisplayMode.Fret,
  chordsDisplayMode: ChordsDisplayMode.Left,
  skin: Skin.Yamaha_SLG200NW,
  settingsExpanded: false,
  chordsExpanded: true,
  controlPanelExpanded: true,
  strummingSettingsExpanded: false,
  strummingPatternEditorExpanded: false,
  showAlert: false,
  alertTimeout: 2000,
  alertType: AlertType.Neutral,
  alertMessage: "",
  suggestedScales: undefined,
  showScalesAlert: false,
  theme: initialTheme,
  fretboardScaleX: 1,
  fretboardScaleY: 1,
  lockRatio: false,
  useAdvancedChords: true,
  useSharpChords: true,
  showAspectRatio: false,
};

export let themeValue: Theme = initialState.theme;

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
  return (percentage / 100) * range + minimum;
};

export const uiSlice = createSlice({
  name: "ui",
  initialState,
  reducers: {
    initUi: (state) => {
      themeValue = state.theme;
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
    setControlPanelExpanded(state, action: PayloadAction<boolean>) {
      state.controlPanelExpanded = action.payload;
    },
    setStrummingSettingsExpanded(state, action: PayloadAction<boolean>) {
      state.strummingSettingsExpanded = action.payload;
    },
    setStrummingPatternEditorExpanded(state, action: PayloadAction<boolean>) {
      state.strummingPatternEditorExpanded = action.payload;
    },
    setAndShowAlert(
      state,
      action: PayloadAction<{
        message: string;
        alertType?: AlertType;
        alertTimeout?: number;
      }>
    ) {
      state.showAlert = true;
      state.alertMessage = action.payload.message;
      state.alertType = action.payload.alertType ?? AlertType.Neutral;
      state.alertTimeout = action.payload.alertTimeout ?? 2000;
    },
    hideAlert(state) {
      state.showAlert = false;
    },
    setSuggestedScales(state, action: PayloadAction<ScaleAndGroup[]>) {
      state.suggestedScales = action.payload;
      state.showScalesAlert = true;
      state.showAlert = false; // hide any existing alert when showing scales
    },
    hideScalesAlert(state) {
      state.showScalesAlert = false;
    },
    setTheme(state, action: PayloadAction<Theme>) {
      state.theme = action.payload;
      themeValue = action.payload;
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
    setUseAdvancedChords(state, action: PayloadAction<boolean>) {
      state.useAdvancedChords = action.payload;
    },
    setUseSharpChords(state, action: PayloadAction<boolean>) {
      state.useSharpChords = action.payload;
    },
    setLoadingMessage(state, action: PayloadAction<string | undefined>) {
      state.loadingMessage = action.payload;
    },
    setShowAspectRatio(state, action: PayloadAction<boolean>) {
      state.showAspectRatio = action.payload;
    },
  },
});

export const {
  initUi,
  setNoteDisplayMode,
  setChordsDisplayMode,
  setSkin,
  setSettingsExpanded,
  setChordsExpanded,
  setControlPanelExpanded,
  setStrummingSettingsExpanded,
  setStrummingPatternEditorExpanded,
  setAndShowAlert,
  hideAlert,
  setSuggestedScales,
  hideScalesAlert,
  setTheme,
  setFretboardScaleX,
  setFretboardScaleY,
  setLockRatio,
  setUseAdvancedChords,
  setUseSharpChords,
  setLoadingMessage,
  setShowAspectRatio,
} = uiSlice.actions;

export const selectUi = (state: RootState) => state.ui;

export default uiSlice.reducer;
