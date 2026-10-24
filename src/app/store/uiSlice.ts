import { AlertType } from "@/app/data/alertType";
import {
  CombinedSkinType,
  EightStringSkin,
  SevenStringSkin,
  Skin,
} from "@/app/data/skin";
import { Theme } from "@/app/data/theme";
import { ScaleAndGroup } from "@/app/engine/scales/scaleLookupBuilder";
import { stringCountValue } from "@/app/store/settingsSlice";
import { PayloadAction, createSlice } from "@reduxjs/toolkit";
import { ChordsDisplayMode } from "../data/chordsDisplayMode";
import { NoteDisplayMode } from "../data/noteDisplayMode";

const initialTheme = Theme.MatchOS;

export const minXZoom = 1;
export const maxXZoom = 3;
export const minYZoom = 0.7;
export const maxYZoom = 1;

interface UiState {
  noteDisplayMode: NoteDisplayMode;
  chordsDisplayMode: ChordsDisplayMode;
  skin: CombinedSkinType;
  settingsExpanded: boolean;
  chordsExpanded: boolean;
  looperExpanded: boolean;
  allChordsShown: boolean;
  controlPanelExpanded: boolean;
  strummingSettingsExpanded: boolean;
  strummingPatternEditorExpanded: boolean;
  slashChordsExpanded: boolean;
  pianoRollExpanded: boolean;
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
  useSharpChords: boolean;
  loadingMessage?: string;
  showAspectRatio: boolean;
}

const initialState: UiState = {
  noteDisplayMode: NoteDisplayMode.Fret,
  chordsDisplayMode: ChordsDisplayMode.Left,
  skin: Skin.Guitar4,
  settingsExpanded: false,
  chordsExpanded: true,
  looperExpanded: false,
  allChordsShown: false,
  controlPanelExpanded: true,
  strummingSettingsExpanded: false,
  strummingPatternEditorExpanded: false,
  slashChordsExpanded: false,
  pianoRollExpanded: false,
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
  useSharpChords: true,
  showAspectRatio: false,
};

export let themeValue: Theme = initialState.theme;

const calculatePercentage = (
  minimum: number,
  maximum: number,
  currentPosition: number,
): number => {
  const percentage: number =
    ((currentPosition - minimum) / (maximum - minimum)) * 100;
  return percentage;
};

const getValueFromPercentage = (
  minimum: number,
  maximum: number,
  percentage: number,
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
    setSkin(state, action: PayloadAction<CombinedSkinType>) {
      state.skin = action.payload;
    },
    setSkinBasedOnStringCount(state) {
      if (stringCountValue === 7) {
        state.skin = SevenStringSkin.Guitar5;
      } else if (stringCountValue === 8) {
        state.skin = EightStringSkin.Guitar6;
      } else {
        state.skin = Skin.Guitar1; // Default to one of the Skin types, update as needed
      }
    },
    setSettingsExpanded: (state, action: PayloadAction<boolean>) => {
      state.settingsExpanded = action.payload;
    },
    setChordsExpanded: (state, action: PayloadAction<boolean>) => {
      state.chordsExpanded = action.payload;
    },
    setLooperExpanded: (state, action: PayloadAction<boolean>) => {
      state.looperExpanded = action.payload;
    },
    setAllChordsShown: (state, action: PayloadAction<boolean>) => {
      state.allChordsShown = action.payload;
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
    setSlashChordsExpanded(state, action: PayloadAction<boolean>) {
      state.slashChordsExpanded = action.payload;
    },
    setPianoRollExpanded(state, action: PayloadAction<boolean>) {
      state.pianoRollExpanded = action.payload;
    },
    setAndShowAlert(
      state,
      action: PayloadAction<{
        message: string;
        alertType?: AlertType;
        alertTimeout?: number;
      }>,
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
          action.payload,
        );
        state.fretboardScaleY = getValueFromPercentage(
          minYZoom,
          maxYZoom,
          100 - relativePosition,
        );
      }
    },
    setFretboardScaleY(state, action: PayloadAction<number>) {
      state.fretboardScaleY = action.payload;
      if (state.lockRatio) {
        const relativePosition = calculatePercentage(
          minYZoom,
          maxYZoom,
          action.payload,
        );
        state.fretboardScaleX = getValueFromPercentage(
          minXZoom,
          maxXZoom,
          100 - relativePosition,
        );
      }
    },
    setLockRatio(state, action: PayloadAction<boolean>) {
      state.lockRatio = action.payload;
      if (state.lockRatio) {
        const relativePositionY = calculatePercentage(
          minYZoom,
          maxYZoom,
          state.fretboardScaleY,
        );
        state.fretboardScaleX = getValueFromPercentage(
          minXZoom,
          maxXZoom,
          100 - relativePositionY,
        );
      }
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
  setSkinBasedOnStringCount,
  setSettingsExpanded,
  setChordsExpanded,
  setLooperExpanded,
  setAllChordsShown,
  setControlPanelExpanded,
  setStrummingSettingsExpanded,
  setStrummingPatternEditorExpanded,
  setSlashChordsExpanded,
  setPianoRollExpanded,
  setAndShowAlert,
  hideAlert,
  setSuggestedScales,
  hideScalesAlert,
  setTheme,
  setFretboardScaleX,
  setFretboardScaleY,
  setLockRatio,
  setUseSharpChords,
  setLoadingMessage,
  setShowAspectRatio,
} = uiSlice.actions;

export default uiSlice.reducer;
