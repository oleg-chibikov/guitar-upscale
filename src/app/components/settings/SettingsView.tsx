import { forwardRef } from "react";
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

export const SettingsView = forwardRef<HTMLDivElement>(({}, ref) => {
  const { theme, chordsDisplayMode } = useSelector(selectControlPanel);

  return (
    <section
      ref={ref}
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
        <ThemeSelector />
        <TuningSelector />
        <BaseNoteSelector />
        <NoteDisplayModeSelector />
        <ChordsDisplayModeSelector />
        <PlaybackTypeSelector />
        <SkinSelector />
        <ChordPlayModeSelector />
        <TempoSlider />
        <ChordStrummingDelaySlider />
        <ChordNotesToPlaySlider />
        <VelocitySlider />
        <MetronomeVelocitySlider />
      </div>
    </section>
  );
});
SettingsView.displayName = "SettingsView";
