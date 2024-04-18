"use client";
import { ChordsDisplayMode } from "@/app/data/chordsDisplayMode";
import { Theme, selectControlPanel } from "@/app/store/controlPanelSlice";
import { useSelector } from "react-redux";
import { LockRatioButton } from "./buttons/LockRatioButton";
import { FretboardScaleXSlider } from "./sliders/FretboardScaleXSlider";
import { FretboardScaleYSlider } from "./sliders/FretboardScaleYSlider";

export const AspectRatioControl: React.FC = () => {
  const { chordsDisplayMode, theme } = useSelector(selectControlPanel);
  return (
    <>
      <div
        className={`z-30 fixed bottom-1 py-1 px-2 ${
          theme === Theme.Light
            ? " bg-accented_background-light"
            : " bg-accented_background-dark"
        } ${
          // it should be on the opposite side of chords to avoid overlapping
          chordsDisplayMode === ChordsDisplayMode.Left ? "right-10" : "left-10"
        }`}
      >
        <FretboardScaleXSlider />
      </div>
      <div
        className={`z-30 fixed bottom-10 py-2 px-1 ${
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
