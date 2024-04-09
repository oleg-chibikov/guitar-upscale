import React from "react";
import { View } from "react-native";
import { tw } from "../../tailwind";
import { ChordsView } from "../chords/ChordsView";
import { ScaleSelector } from "./ScaleSelector";
import { SettingsView } from "./SettingsView";
import { FullscreenButton } from "./buttons/FullscreenButton";
import { OpenChordsButton } from "./buttons/OpenChordsButton";
import { OpenSettingsButton } from "./buttons/OpenSettingsButton";
import { PlayButton } from "./buttons/PlayButton";

export const ControlPanel: React.FC = () => {
  return (
    <>
      <View
        style={[
          tw`z-30 top-1 left-1 flex flex-row gap-1 items-center pr-4`,
          {
            maxWidth: "95%",
            maxHeight: "95%",
            overflow: "auto",
            position: "fixed",
          },
        ]}
      >
        <ScaleSelector />
        <View style={tw`flex flex-col gap-1`}>
          <OpenSettingsButton />
          <OpenChordsButton />
        </View>
        <View style={tw`flex flex-col gap-1`}>
          <PlayButton />
          <FullscreenButton />
        </View>
      </View>
      <SettingsView />
      <ChordsView />
    </>
  );
};
