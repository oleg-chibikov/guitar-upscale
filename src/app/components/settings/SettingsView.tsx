import { forwardRef, useRef } from "react";
import { useSelector } from "react-redux";
import { ChordsDisplayMode } from "../../data/chordsDisplayMode";
import { Theme, selectControlPanel } from "../../store/controlPanelSlice";
import { SwitchToChromaticScaleCheckbox } from "./checkboxes/SwitchToChromaticScaleCheckbox";
import { UseAdvancedChordsCheckbox } from "./checkboxes/UseAdvancedChordsChekbox";
import { BaseNoteSelector } from "./selectors/BaseNoteSelector";
import { ChordPlayModeSelector } from "./selectors/ChordPlayModeSelector";
import { ChordsDisplayModeSelector } from "./selectors/ChordsDisplayModeSelector";
import { NoteDisplayModeSelector } from "./selectors/NoteDisplayModeSelector";
import { PlaybackTypeSelector } from "./selectors/PlaybackTypeSelector";
import { SkinSelector } from "./selectors/SkinSelector";
import { ThemeSelector } from "./selectors/ThemeSelector";
import { TuningSelector } from "./selectors/TuningSelector";
import { ChordNotesToPlaySlider } from "./sliders/ChordNotesToPlaySlider";
import { ChordStrummingDelaySlider } from "./sliders/ChordStrummingSlider";
import { MetronomeVelocitySlider } from "./sliders/MetronomeVelocitySlider";
import { TempoSlider } from "./sliders/TempoSlider";
import { VelocitySlider } from "./sliders/VelocitySlider";

export const SettingsView = forwardRef(() => {
  const { theme, chordsDisplayMode } = useSelector(selectControlPanel);
  const settingsRef = useRef<HTMLDivElement>(null);

  return (
    <section
      ref={settingsRef}
      className={`flex flex-col opacity-95 overflow-auto fixed ${
        // it should be on the opposite side of chords to avoid overlapping
        chordsDisplayMode === ChordsDisplayMode.Left ? "right-1" : "left-1"
      } z-40 top-20 border-2 ${
        theme === Theme.Light
          ? "bg-accented_background-light border-border-light"
          : "bg-accented_background-dark border-border-dark"
      } p-4 gap-2`}
      style={{
        maxWidth: "80vw",
        maxHeight: "60vh",
      }}
    >
      <SwitchToChromaticScaleCheckbox />
      <UseAdvancedChordsCheckbox />
      <div
        className={`grid gap-2 ${
          theme === Theme.Light
            ? "text-foreground-light"
            : "text-foreground-dark"
        }`}
        style={{
          gridTemplateColumns: "auto minmax(200px, auto)",
        }}
      >
        <span>Theme:</span>
        <ThemeSelector />
        <span>Tuning:</span>
        <TuningSelector />
        <span>Base Note:</span>
        <BaseNoteSelector />
        <span>Note Display Mode:</span>
        <NoteDisplayModeSelector />
        <span>Chords Display Mode:</span>
        <ChordsDisplayModeSelector />
        <span>Playback type:</span>
        <PlaybackTypeSelector />
        <span>Skin:</span>
        <SkinSelector />
        <span>Chord play mode:</span>
        <ChordPlayModeSelector />
        <span>Playback speed:</span>
        <TempoSlider />
        <span>Chord strumming delay:</span>
        <ChordStrummingDelaySlider />
        <span>Notes to play in chord:</span>
        <ChordNotesToPlaySlider />
        <span>Playback volume:</span>
        <VelocitySlider />
        <span>Metronome volume:</span>
        <MetronomeVelocitySlider />
      </div>
    </section>
  );
});
SettingsView.displayName = "SettingsView";
