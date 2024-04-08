import React from "react";
import { Text, View } from "react-native";
import { useSelector } from "react-redux";
import { selectControlPanel } from "../../store/controlPanelSlice";
import { tw } from "../../tailwind";
import { BaseNoteSelector } from "./BaseNoteSelector";
import { ChordPlayModeSelector } from "./ChordPlayModeSelector";
import { ChordStrummingDelaySlider } from "./ChordStrummingSlider";
import { NoteDisplayModeSelector } from "./NoteDisplayModeSelector";
import { PlayIntervalSlider } from "./PlayIntervalSlider";
import { PlaybackTypeSelector } from "./PlaybackTypeSelector";
import { SkinSelector } from "./SkinSelector";
import { SwitchToChromaticScaleCheckbox } from "./SwitchToChromaticScaleCheckbox";
import { ThemeSelector } from "./ThemeSelector";
import { UseAdvancedChordsCheckbox } from "./UseAdvancedChordsChekbox";
import { VelocitySlider } from "./VelocitySlider";

export const SettingsView: React.FC = () => {
  const { settingsExpanded, bg, textStyle } = useSelector(selectControlPanel);
  return (
    settingsExpanded && (
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
          <PlayIntervalSlider />
          <Text style={textStyle}>Chord strumming delay:</Text>
          <ChordStrummingDelaySlider />
          <Text style={textStyle}>Playback volume:</Text>
          <VelocitySlider />
          <Text style={textStyle}>Skin:</Text>
          <SkinSelector />
          <Text style={textStyle}>Chord play mode:</Text>
          <ChordPlayModeSelector />
        </View>
        <SwitchToChromaticScaleCheckbox />
        <UseAdvancedChordsCheckbox />
      </View>
    )
  );
};
