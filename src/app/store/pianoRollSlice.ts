import { TimeSignature } from "@/app/data/clockConstants";
import { PayloadAction, createSlice } from "@reduxjs/toolkit";

interface PianoRollState {
  pianoRollSnap: TimeSignature;
}

const initialState: PianoRollState = {
  pianoRollSnap: TimeSignature.HALF_BEAT,
};

export const PianoRollSlice = createSlice({
  name: "PianoRoll",
  initialState,
  reducers: {
    setPianoRollSnap(state, action: PayloadAction<TimeSignature>) {
      state.pianoRollSnap = action.payload;
    },
  },
});

export const { setPianoRollSnap } = PianoRollSlice.actions;

export default PianoRollSlice.reducer;
