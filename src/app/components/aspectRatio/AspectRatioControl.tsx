import { LockRatioButton } from "@/app/components/aspectRatio/LockRatioButton";
import { ChordsDisplayMode } from "@/app/data/chordsDisplayMode";
import { Theme } from "@/app/data/theme";
import { useUiSelector } from "@/app/hooks/storeHooks";
import { FretboardScaleXSlider } from "./FretboardScaleXSlider";
import { FretboardScaleYSlider } from "./FretboardScaleYSlider";

export const AspectRatioControl: React.FC = () => {
  const chordsDisplayMode = useUiSelector((s) => s.chordsDisplayMode);
  const theme = useUiSelector((s) => s.theme);
  return (
    <>
      <div
        className={`z-30 fixed bottom-1 px-1 ${
          theme === Theme.Light
            ? " bg-accented_background-light"
            : " bg-accented_background-dark"
        } ${
          // it should be on the opposite side of chords to avoid overlapping
          chordsDisplayMode === ChordsDisplayMode.Left
            ? "right-10 rounded-l-md"
            : "left-10 rounded-r-md"
        }`}
      >
        <FretboardScaleXSlider />
      </div>
      <div
        className={`z-30 fixed bottom-10 py-1 rounded-t-md ${
          theme === Theme.Light
            ? " bg-accented_background-light"
            : " bg-accented_background-dark"
        } ${
          // it should be on the opposite side of chords to avoid overlapping
          chordsDisplayMode === ChordsDisplayMode.Left ? "right-1" : "left-1"
        }`}
      >
        <FretboardScaleYSlider />
      </div>
      <div
        className={`z-30 fixed bottom-1  ${
          // it should be on the opposite side of chords to avoid overlapping
          chordsDisplayMode === ChordsDisplayMode.Left ? "right-1" : "left-1"
        }`}
      >
        <LockRatioButton />
      </div>
    </>
  );
};
