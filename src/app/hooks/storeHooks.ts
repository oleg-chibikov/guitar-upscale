import { pianoRollInitialState } from "@/app/store/pianoRollSlice";
import { RootState } from "@/app/store/store";
import { useSelector } from "react-redux";

export const useSettingsSelector = <T>(
  selector: (state: RootState["settings"]) => T,
): T => {
  return useSelector((state: RootState) => selector(state.settings));
};

export const usePianoRollSelector = <T>(
  selector: (state: RootState["pianoRoll"]) => T,
): T => {
  // fields added after a user saved the state come back undefined from redux-persist
  return useSelector((state: RootState) =>
    selector({ ...pianoRollInitialState, ...state.pianoRoll }),
  );
};

export const useUiSelector = <T>(
  selector: (state: RootState["ui"]) => T,
): T => {
  return useSelector((state: RootState) => selector(state.ui));
};

export const useAuthSelector = <T>(
  selector: (state: RootState["auth"]) => T,
): T => {
  return useSelector((state: RootState) => selector(state.auth));
};
