import React from "react";
import { Text, View } from "react-native";
import { useSelector } from "react-redux";
import { ChordsDisplayMode } from "../../data/chordsDisplayMode";
import { selectControlPanel } from "../../store/controlPanelSlice";
import { tw } from "../../tailwind";
import { SwitchToChromaticScaleCheckbox } from "./checkboxes/SwitchToChromaticScaleCheckbox";
import { UseAdvancedChordsCheckbox } from "./checkboxes/UseAdvancedChordsChekbox";
import { BaseNoteSelector } from "./selectors/BaseNoteSelector";
import { ChordPlayModeSelector } from "./selectors/ChordPlayModeSelector";
import { ChordsDisplayModeSelector } from "./selectors/ChordsDisplayModeSelector";
import { NoteDisplayModeSelector } from "./selectors/NoteDisplayModeSelector";
import { PlaybackTypeSelector } from "./selectors/PlaybackTypeSelector";
import { SkinSelector } from "./selectors/SkinSelector";
import { ThemeSelector } from "./selectors/ThemeSelector";
import { ChordStrummingDelaySlider } from "./sliders/ChordStrummingSlider";
import { PlayIntervalSlider } from "./sliders/PlayIntervalSlider";
import { VelocitySlider } from "./sliders/VelocitySlider";

export const SettingsView: React.FC = () => {
  const { settingsExpanded, bg, textStyle, chordsDisplayMode } =
    useSelector(selectControlPanel);
  return (
    settingsExpanded && (
      <View
        style={[
          tw`opacity-95 ${
            // it should be on the opposite side of chords to avoid overlapping
            chordsDisplayMode === ChordsDisplayMode.Left ? "right" : "left"
          }-1 z-40 top-15 ${bg} p-2 gap-2`,
          {
            maxWidth: "95%",
            maxHeight: "95%",
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
          <Text style={textStyle}>Chords Display Mode:</Text>
          <ChordsDisplayModeSelector />
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
