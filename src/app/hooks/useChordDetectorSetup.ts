import { AlertType } from "@/app/data/alertType";
import {
  addChordToDetectorLookup,
  setChordDetectorFunctions,
} from "@/app/engine/chords/chordLookupBuilder";
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
    const { mainChordDetector } = await import(
      "@/app/engine/chords/chordDetector"
    );
    setChordDetectorFunctions(
      mainChordDetector.clearDetector.bind(mainChordDetector),
      mainChordDetector.addChordToDetectorLookup.bind(mainChordDetector)
    );
    mainChordDetector.setChordFoundCallback((chordNames, alertType) => {
      dispatch(
        setAndShowAlert({
          message: chordNames || "No matching chords",
          alertType:
            alertType ?? (chordNames ? AlertType.Success : AlertType.Warning),
          alertTimeout: 5000,
        })
      );
    });
  };
};
