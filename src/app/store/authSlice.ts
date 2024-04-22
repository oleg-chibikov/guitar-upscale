import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { RootState } from "./store"; // Define RootState type

interface AuthState {
  isSignedIn: boolean;
  subscriptionTier?: string;
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
    setSubscriptionTier(state, action: PayloadAction<string | undefined>) {
      state.subscriptionTier = action.payload;
    },
  },
});

export const { setIsSignedIn, setSubscriptionTier } = authSlice.actions;

export const selectAuth = (state: RootState) => state.auth;

export default authSlice.reducer;
