import { ChordsDisplayMode } from "@/app/data/chordsDisplayMode";
import { Theme } from "@/app/data/theme";
import { selectUi } from "@/app/store/uiSlice";
import { useSelector } from "react-redux";
import { LockRatioButton } from "./buttons/LockRatioButton";
import { FretboardScaleXSlider } from "./sliders/FretboardScaleXSlider";
import { FretboardScaleYSlider } from "./sliders/FretboardScaleYSlider";

export const AspectRatioControl: React.FC = () => {
  const { chordsDisplayMode, theme } = useSelector(selectUi);
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
            ? "right-6 rounded-l-md"
            : "left-6 rounded-r-md"
        }`}
      >
        <FretboardScaleXSlider />
      </div>
      <div
        className={`z-30 fixed bottom-6 py-1 rounded-t-md ${
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
        className={`z-30 fixed bottom-1 ${
          // it should be on the opposite side of chords to avoid overlapping
          chordsDisplayMode === ChordsDisplayMode.Left ? "right-1" : "left-1"
        }`}
      >
        <LockRatioButton />
      </div>
    </>
  );
};
