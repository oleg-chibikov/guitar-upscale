import React from "react";
import { useSelector } from "react-redux";
import { ChordsDisplayMode } from "../../data/chordsDisplayMode";
import { selectControlPanel } from "../../store/controlPanelSlice";
import { ChordsView } from "../chords/ChordsView";
import { SettingsView } from "./SettingsView";
import { ButtonContainer } from "./buttons/ButtonContainer";
import { LockRatioButton } from "./buttons/LockRatioButton";
import { ScaleAndGroupSelector } from "./selectors/ScaleAndGroupSelector";
import { FretboardScaleXSlider } from "./sliders/FretboardScaleXSlider";
import { FretboardScaleYSlider } from "./sliders/FretboardScaleYSlider";

export const ControlPanel: React.FC = () => {
  const { chordsDisplayMode } = useSelector(selectControlPanel);
  return (
    <>
      <section
        className={`z-30 overflow-auto fixed top-1 ${
          // it should be on the opposite side of chords to avoid overlapping
          chordsDisplayMode === ChordsDisplayMode.Left ? "right" : "left"
        }-1 flex ${
          // it should be on the opposite side of chords to avoid overlapping
          chordsDisplayMode === ChordsDisplayMode.Left
            ? "flex-row-reverse"
            : "flex-row"
        } gap-1 items-start`}
        style={{
          maxWidth: "80vw",
          maxHeight: "60vh",
        }}
      >
        <ScaleAndGroupSelector />
        <ButtonContainer />
      </section>
      <SettingsView />
      <ChordsView />

      <div
        className={`z-30 fixed bottom-1 ${
          // it should be on the opposite side of chords to avoid overlapping
          chordsDisplayMode === ChordsDisplayMode.Left ? "right" : "left"
        }-1`}
      >
        <FretboardScaleXSlider />
      </div>
      <div
        className={`z-30 fixed bottom-7 ${
          // it should be on the opposite side of chords to avoid overlapping
          chordsDisplayMode === ChordsDisplayMode.Left ? "right" : "left"
        }-1`}
      >
        <FretboardScaleYSlider />
      </div>
      <div
        className={`z-30 fixed bottom-7 ${
          // it should be on the opposite side of chords to avoid overlapping
          chordsDisplayMode === ChordsDisplayMode.Left ? "right" : "left"
        }-12`}
      >
        <LockRatioButton />
      </div>
    </>
  );
};
