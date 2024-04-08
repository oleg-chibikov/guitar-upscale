import React from "react";
import { Text, TextStyle, View } from "react-native";
import { tw } from "../../tailwind";
import { BaseNoteSelector } from "./BaseNoteSelector";
import { MatchFullChordCheckbox } from "./MatchFullChordCheckbox";
import { NoteDisplayModeSelector } from "./NoteDisplayModeSelector";
import { PlayIntervalSlider } from "./PlayIntervalSlider";
import { PlaybackTypeSelector } from "./PlaybackTypeSelector";
import { SkinSelector } from "./SkinSelector";
import { SwitchToChromaticScaleCheckbox } from "./SwitchToChromaticScaleCheckbox";
import { ThemeSelector } from "./ThemeSelector";
import { UseAdvancedChordsCheckbox } from "./UseAdvancedChordsChekbox";
import { VelocitySlider } from "./VelocitySlider";

export const SettingsView: React.FC<{ bg: string; textStyle: TextStyle }> = ({
  bg,
  textStyle,
}) => (
  <View
    style={[
      tw`max-w-full max-h-full opacity-95 left-3 z-20 top-25 ${bg} p-2 rounded-md gap-2`,
      {
        overflow: "auto",
        position: "fixed",
      },
    ]}
  >
    <View
      style={
        {
          display: "grid",
          gap: 8,
          gridTemplateColumns: "auto minmax(200px, auto)",
        } as any
      }
    >
      <Text style={textStyle}>Theme:</Text>
      <ThemeSelector />
      <Text style={textStyle}>Base Note:</Text>
      <BaseNoteSelector />
      <Text style={textStyle}>Note Display Mode:</Text>
      <NoteDisplayModeSelector />
      <Text style={textStyle}>Playback type:</Text>
      <PlaybackTypeSelector />
      <Text style={textStyle}>Playback speed:</Text>
      <PlayIntervalSlider textStyle={textStyle} />
      <Text style={textStyle}>Playback volume:</Text>
      <VelocitySlider textStyle={textStyle} />
      <Text style={textStyle}>Skin:</Text>
      <SkinSelector />
    </View>
    <SwitchToChromaticScaleCheckbox />
    <MatchFullChordCheckbox />
    <UseAdvancedChordsCheckbox />
  </View>
);
