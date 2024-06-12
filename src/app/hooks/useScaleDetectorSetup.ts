import { AlertType } from "@/app/data/alertType";
import {
  addScaleToDetectorLookup,
  setScaleDetectorFunctions,
} from "@/app/store/settingsSlice";
import { setAndShowAlert } from "@/app/store/uiSlice";
import { useDispatch } from "react-redux";

// returns a function to setup scale detector
export const useScaleDetectorSetup = () => {
  const dispatch = useDispatch();
  return async () => {
    if (addScaleToDetectorLookup !== undefined) {
      return;
    }

    // async load detector module and set its functions to settings on the first detect action.
    const { mainDetector } = await import("@/app/engine/scales/scaleDetector");
    setScaleDetectorFunctions(
      mainDetector.addScaleToDetectorLookup.bind(mainDetector)
    );
    mainDetector.setScaleFoundCallback((scaleNames) => {
      dispatch(
        setAndShowAlert({
          message: scaleNames || "No matching scales",
          alertType: !scaleNames ? AlertType.Warning : AlertType.Success,
        })
      );
    });
  };
};
