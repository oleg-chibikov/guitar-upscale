import {
  addScaleToDetectorLookup,
  setScaleDetectorFunctions,
} from "@/app/engine/scales/scaleLookupBuilder";
import { setAndShowAlert, setSuggestedScales } from "@/app/store/uiSlice";
import { useDispatch } from "react-redux";

// returns a function to setup scale detector
export const useScaleDetectorSetup = () => {
  const dispatch = useDispatch();
  return async () => {
    if (addScaleToDetectorLookup !== undefined) {
      return;
    }

    // async load detector module and set its functions to settings on the first detect action.
    const { mainScaleDetector } = await import(
      "@/app/engine/scales/scaleDetector"
    );
    setScaleDetectorFunctions(
      mainScaleDetector.clearDetector.bind(mainScaleDetector),
      mainScaleDetector.addScaleToDetectorLookup.bind(mainScaleDetector)
    );
    mainScaleDetector.setScaleFoundCallback(({ text, scales, alertType }) => {
      if (scales === undefined) {
        dispatch(
          setAndShowAlert({
            message: text,
            alertType: alertType,
            alertTimeout: 5000,
          })
        );
      } else {
        dispatch(setSuggestedScales(scales));
      }
    });
  };
};
