import {
  isMetronomeActiveValue,
  isPausedValue,
  setIsMetronomeActive,
  setIsPaused,
} from "@/app/store/settingsSlice";
import { Dispatch, UnknownAction } from "redux";

export const togglePause = (dispatch: Dispatch<UnknownAction>) => {
  const pausing = !isPausedValue;
  dispatch(setIsPaused(pausing));
  if (pausing && isMetronomeActiveValue) {
    dispatch(setIsMetronomeActive(false));
  }
};
