import React from "react";
import { View, ViewStyle } from "react-native";
import { useSelector } from "react-redux";
import { ChordsDisplayMode } from "../../../data/chordsDisplayMode";
import { selectControlPanel } from "../../../store/controlPanelSlice";
import { tw } from "../../../tailwind";
import { FullscreenButton } from "./FullscreenButton";
import { OpenChordsButton } from "./OpenChordsButton";
import { OpenSettingsButton } from "./OpenSettingsButton";
import { PlayButton } from "./PlayButton";
import { RecordButton } from "./RecordButton";

interface ButtonContainerProps {
  style?: ViewStyle;
}

export const ButtonContainer: React.FC<ButtonContainerProps> = ({ style }) => {
  const { chordsDisplayMode } = useSelector(selectControlPanel);
  return (
    <View style={[tw`flex flex-col gap-1`, style]}>
      <View
        style={[
          tw`flex flex-row gap-1 justify-${
            chordsDisplayMode === ChordsDisplayMode.Left ? "end" : "start"
          }`,
        ]}
      >
        <OpenSettingsButton />
        <OpenChordsButton />
        <FullscreenButton />
      </View>
      <View
        style={[
          tw`flex flex-row gap-1 justify-${
            chordsDisplayMode === ChordsDisplayMode.Left ? "end" : "start"
          }`,
        ]}
      >
        <PlayButton />
        <RecordButton />
      </View>
    </View>
  );
};
