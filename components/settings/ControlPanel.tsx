import React from "react";
import { View } from "react-native";
import { useSelector } from "react-redux";
import { ChordsDisplayMode } from "../../data/chordsDisplayMode";
import { selectControlPanel } from "../../store/controlPanelSlice";
import { tw } from "../../tailwind";
import { ChordsView } from "../chords/ChordsView";
import { SettingsView } from "./SettingsView";
import { ButtonContainer } from "./buttons/ButtonContainer";
import { LockRatioButton } from "./buttons/LockRatioButton";
import { ScaleSelector } from "./selectors/ScaleSelector";
import { FretboardScaleXSlider } from "./sliders/FretboardScaleXSlider";
import { FretboardScaleYSlider } from "./sliders/FretboardScaleYSlider";

export const ControlPanel: React.FC = () => {
  const { chordsDisplayMode } = useSelector(selectControlPanel);
  return (
    <>
      <View
        style={[
          tw`z-30 top-1 ${
            // it should be on the opposite side of chords to avoid overlapping
            chordsDisplayMode === ChordsDisplayMode.Left ? "right" : "left"
          }-1} flex ${
            // it should be on the opposite side of chords to avoid overlapping
            chordsDisplayMode === ChordsDisplayMode.Left
              ? "flex-row-reverse"
              : "flex-row"
          } gap-1 items-center`,
          {
            maxWidth: "95%",
            maxHeight: "95%",
            overflow: "auto",
            position: "fixed",
          },
        ]}
      >
        <ScaleSelector />
        <ButtonContainer />
      </View>
      <SettingsView />
      <ChordsView />

      <View
        style={[
          tw`z-30 bottom-1 ${
            // it should be on the opposite side of chords to avoid overlapping
            chordsDisplayMode === ChordsDisplayMode.Left ? "right" : "left"
          }-1}`,
          {
            position: "fixed",
          },
        ]}
      >
        <FretboardScaleXSlider />
      </View>
      <View
        style={[
          tw`z-30 bottom-7 ${
            // it should be on the opposite side of chords to avoid overlapping
            chordsDisplayMode === ChordsDisplayMode.Left ? "right" : "left"
          }-1}`,
          {
            position: "fixed",
          },
        ]}
      >
        <FretboardScaleYSlider />
      </View>
      <View
        style={[
          tw`z-30 bottom-7 ${
            // it should be on the opposite side of chords to avoid overlapping
            chordsDisplayMode === ChordsDisplayMode.Left ? "right" : "left"
          }-12}`,
          {
            position: "fixed",
          },
        ]}
      >
        <LockRatioButton />
      </View>
    </>
  );
};
