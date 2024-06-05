import { AlertType } from "@/app/data/alertType";
import {
  addChordToDetectorLookup,
  setChordDetectorFunctions,
} from "@/app/store/settingsSlice";
import { setAndShowAlert } from "@/app/store/uiSlice";
import { useDispatch } from "react-redux";

// returns a function to setup chord detector
export const useChordDetectorSetup = () => {
  const dispatch = useDispatch();
  return async () => {
    if (addChordToDetectorLookup !== undefined) {
      return;
    }

    // async load detector module and set its functions to settings on the first detect action.
    const { mainDetector } = await import("@/app/engine/chords/chordDetector");
    setChordDetectorFunctions(
      mainDetector.addChordToDetectorLookup.bind(mainDetector)
    );
    mainDetector.setChordFoundCallback((chordNames) => {
      dispatch(
        setAndShowAlert({
          message: chordNames || "No matching chords",
          alertType: !chordNames ? AlertType.Warning : AlertType.Success,
        })
      );
    });
  };
};
