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
  // scroll along with the playhead during playback
  followPlayback: boolean;
}

export const pianoRollInitialState: PianoRollState = {
  pianoRollSnap: TimeSignature.HALF_BEAT,
  tool: PianoRollTool.Select,
  snapToScale: true,
  copyMode: false,
  axisLock: false,
  pixelsPerTick: DEFAULT_PIXELS_PER_TICK,
  noteHeight: DEFAULT_NOTE_HEIGHT,
  followPlayback: true,
};

const clamp = (value: number, min: number, max: number) =>
  Math.max(min, Math.min(max, value));

export const clampPixelsPerTick = (value: number) =>
  clamp(value, MIN_PIXELS_PER_TICK, MAX_PIXELS_PER_TICK);

export const clampNoteHeight = (value: number) =>
  clamp(value, MIN_NOTE_HEIGHT, MAX_NOTE_HEIGHT);

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
    setFollowPlayback(state, action: PayloadAction<boolean>) {
      state.followPlayback = action.payload;
    },
    setPianoRollZoom(
      state,
      action: PayloadAction<{ pixelsPerTick?: number; noteHeight?: number }>
    ) {
      const { pixelsPerTick, noteHeight } = action.payload;
      if (pixelsPerTick !== undefined) {
        state.pixelsPerTick = clampPixelsPerTick(pixelsPerTick);
      }
      if (noteHeight !== undefined) {
        state.noteHeight = clampNoteHeight(noteHeight);
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
  setFollowPlayback,
} = PianoRollSlice.actions;

export default PianoRollSlice.reducer;
