import { TimeSignature } from "@/app/data/clockConstants";
import {
  DEFAULT_NOTE_HEIGHT,
  DEFAULT_PIXELS_PER_TICK,
  MAX_NOTE_HEIGHT,
  MAX_PIXELS_PER_TICK,
  MIN_NOTE_HEIGHT,
  MIN_PIXELS_PER_TICK,
} from "@/app/data/pianoRollConstants";
import { PayloadAction, createSlice } from "@reduxjs/toolkit";

export enum PianoRollTool {
  Select = "select",
  Draw = "draw",
  Erase = "erase",
}

export interface PianoRollState {
  pianoRollSnap: TimeSignature;
  tool: PianoRollTool;
  snapToScale: boolean;
  // touch screens have no modifier keys, so these stand in for Alt and Ctrl
  copyMode: boolean;
  axisLock: boolean;
  pixelsPerTick: number;
  noteHeight: number;
}

export const pianoRollInitialState: PianoRollState = {
  pianoRollSnap: TimeSignature.HALF_BEAT,
  tool: PianoRollTool.Select,
  snapToScale: true,
  copyMode: false,
  axisLock: false,
  pixelsPerTick: DEFAULT_PIXELS_PER_TICK,
  noteHeight: DEFAULT_NOTE_HEIGHT,
};

const clamp = (value: number, min: number, max: number) =>
  Math.max(min, Math.min(max, value));

export const PianoRollSlice = createSlice({
  name: "PianoRoll",
  initialState: pianoRollInitialState,
  reducers: {
    setPianoRollSnap(state, action: PayloadAction<TimeSignature>) {
      state.pianoRollSnap = action.payload;
    },
    setPianoRollTool(state, action: PayloadAction<PianoRollTool>) {
      state.tool = action.payload;
    },
    setSnapToScale(state, action: PayloadAction<boolean>) {
      state.snapToScale = action.payload;
    },
    setCopyMode(state, action: PayloadAction<boolean>) {
      state.copyMode = action.payload;
    },
    setAxisLock(state, action: PayloadAction<boolean>) {
      state.axisLock = action.payload;
    },
    setPianoRollZoom(
      state,
      action: PayloadAction<{ pixelsPerTick?: number; noteHeight?: number }>
    ) {
      const { pixelsPerTick, noteHeight } = action.payload;
      if (pixelsPerTick !== undefined) {
        state.pixelsPerTick = clamp(
          pixelsPerTick,
          MIN_PIXELS_PER_TICK,
          MAX_PIXELS_PER_TICK
        );
      }
      if (noteHeight !== undefined) {
        state.noteHeight = clamp(noteHeight, MIN_NOTE_HEIGHT, MAX_NOTE_HEIGHT);
      }
    },
  },
});

export const {
  setPianoRollSnap,
  setPianoRollTool,
  setSnapToScale,
  setCopyMode,
  setAxisLock,
  setPianoRollZoom,
} = PianoRollSlice.actions;

export default PianoRollSlice.reducer;
