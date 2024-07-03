import { TierInfo } from "@/lib/tier";
import { createSlice, PayloadAction } from "@reduxjs/toolkit";

interface AuthState {
  isSignedIn: boolean;
  subscriptionTier?: TierInfo;
}

const initialState: AuthState = {
  isSignedIn: false,
};

export const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setIsSignedIn(state, action: PayloadAction<boolean>) {
      state.isSignedIn = action.payload;
    },
    setSubscriptionTier(state, action: PayloadAction<TierInfo | undefined>) {
      state.subscriptionTier = action.payload;
    },
  },
});

export const { setIsSignedIn, setSubscriptionTier } = authSlice.actions;

export default authSlice.reducer;
