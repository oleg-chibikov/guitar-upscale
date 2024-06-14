import {
  addScaleToDetectorLookup,
  setScaleDetectorFunctions,
} from "@/app/engine/scales/scaleLookupBuilder";

// returns a function to setup scale detector
export const useScaleDetectorSetup = () => {
  return async () => {
    if (addScaleToDetectorLookup !== undefined) {
      return;
    }

    // async load detector module and set its functions to settings on the first detect action.
    const { scaleDetector } = await import("@/app/engine/scales/scaleDetector");
    const { scaleDetectorBuilder } = await import(
      "@/app/engine/scales/scaleDetectorBuilder"
    );
    setScaleDetectorFunctions(
      scaleDetectorBuilder.clear.bind(scaleDetectorBuilder),
      scaleDetector.addScaleToDetectorLookup.bind(scaleDetector)
    );
  };
};
