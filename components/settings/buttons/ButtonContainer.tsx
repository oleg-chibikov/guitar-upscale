import React from "react";
import { View, ViewStyle } from "react-native";
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
  return (
    <View style={[tw`flex flex-row gap-1`, style]}>
      <OpenSettingsButton />
      <OpenChordsButton />
      <PlayButton />
      <FullscreenButton />
      <RecordButton />
    </View>
  );
};
