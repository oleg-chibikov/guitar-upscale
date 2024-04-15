import React from "react";
import { useSelector } from "react-redux";
import { ChordsDisplayMode } from "../../data/chordsDisplayMode";
import { selectControlPanel } from "../../store/controlPanelSlice";
import { SwitchToChromaticScaleCheckbox } from "./checkboxes/SwitchToChromaticScaleCheckbox";
import { UseAdvancedChordsCheckbox } from "./checkboxes/UseAdvancedChordsChekbox";
import { BaseNoteSelector } from "./selectors/BaseNoteSelector";
import { ChordPlayModeSelector } from "./selectors/ChordPlayModeSelector";
import { ChordsDisplayModeSelector } from "./selectors/ChordsDisplayModeSelector";
import { NoteDisplayModeSelector } from "./selectors/NoteDisplayModeSelector";
import { PlaybackTypeSelector } from "./selectors/PlaybackTypeSelector";
import { SkinSelector } from "./selectors/SkinSelector";
import { ThemeSelector } from "./selectors/ThemeSelector";
import { ChordNotesToPlaySlider } from "./sliders/ChordNotesToPlaySlider";
import { ChordStrummingDelaySlider } from "./sliders/ChordStrummingSlider";
import { PlayIntervalSlider } from "./sliders/PlayIntervalSlider";
import { VelocitySlider } from "./sliders/VelocitySlider";

export const SettingsView: React.FC = () => {
  const { settingsExpanded, bg, textStyle, chordsDisplayMode } =
    useSelector(selectControlPanel);
  return (
    settingsExpanded && (
      <div
        className={`opacity-95 overflow-auto fixed ${
          // it should be on the opposite side of chords to avoid overlapping
          chordsDisplayMode === ChordsDisplayMode.Left ? "right" : "left"
        }-1 z-40 top-20 ${bg} p-2 gap-2`}
        style={{
          maxWidth: "95%",
          maxHeight: "95%",
        }}
      >
        <div
          className={`grid gap-4 ${textStyle}`}
          style={{
            gridTemplateColumns: "auto minmax(200px, auto)",
          }}
        >
          <span>Theme:</span>
          <ThemeSelector />
          <span>Base Note:</span>
          <BaseNoteSelector />
          <span>Note Display Mode:</span>
          <NoteDisplayModeSelector />
          <span>Chords Display Mode:</span>
          <ChordsDisplayModeSelector />
          <span>Playback type:</span>
          <PlaybackTypeSelector />
          <span>Playback speed:</span>
          <PlayIntervalSlider />
          <span>Chord strumming delay:</span>
          <ChordStrummingDelaySlider />
          <span>Notes to play in chord:</span>
          <ChordNotesToPlaySlider />
          <span>Playback volume:</span>
          <VelocitySlider />
          <span>Skin:</span>
          <SkinSelector />
          <span>Chord play mode:</span>
          <ChordPlayModeSelector />
        </div>
        <SwitchToChromaticScaleCheckbox />
        <UseAdvancedChordsCheckbox />
      </div>
    )
  );
};
