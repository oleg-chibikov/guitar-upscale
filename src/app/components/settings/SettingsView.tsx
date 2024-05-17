import { CloseIcon } from "@/app/CloseIcon";
import { ChordsDisplayMode } from "@/app/data/chordsDisplayMode";
import { Theme } from "@/app/data/theme";
import { WithPremiumComponents } from "@/app/helpers/WithPremiumFeatures";
import { isMobileDevice } from "@/app/helpers/deviceHelper";
import { selectUi, setSettingsExpanded } from "@/app/store/uiSlice";
import { Slide } from "@mui/material";
import { ReactNode } from "react";
import { useDispatch, useSelector } from "react-redux";
import { SwitchToChromaticScaleCheckbox } from "./checkboxes/SwitchToChromaticScaleCheckbox";
import { UseChordAlterationCheckbox } from "./checkboxes/UseChordAlterationCheckbox";
import { UseSharpChordsCheckbox } from "./checkboxes/UseSharpChordsChekbox";
import { BaseNoteSelector } from "./selectors/BaseNoteSelector";
import { ChordPlayModeSelector } from "./selectors/ChordPlayModeSelector";
import { ChordsDisplayModeSelector } from "./selectors/ChordsDisplayModeSelector";
import { NoteDisplayModeSelector } from "./selectors/NoteDisplayModeSelector";
import { ThemeSelector } from "./selectors/ThemeSelector";
import { TuningSelector } from "./selectors/TuningSelector";
import { ChordNotesToPlaySlider } from "./sliders/ChordNotesToPlaySlider";
import { ChordStrummingDelaySlider } from "./sliders/ChordStrummingSlider";
import { MetronomeVelocitySlider } from "./sliders/MetronomeVelocitySlider";
import { TempoSlider } from "./sliders/TempoSlider";
import { VelocitySlider } from "./sliders/VelocitySlider";

export const SettingsView: React.FC<WithPremiumComponents> = ({
  premiumComponents,
}) => {
  const { theme, chordsDisplayMode, settingsExpanded } = useSelector(selectUi);
  const dispatch = useDispatch();
  return (
    <Slide direction="down" in={settingsExpanded} mountOnEnter unmountOnExit>
      <section
        id="settings"
        className={`flex flex-col opacity-95 overflow-auto overscroll-contain fixed ${
          // it should be on the opposite side of chords to avoid overlapping
          chordsDisplayMode === ChordsDisplayMode.Left ? "right-1" : "left-1"
        } z-40 top-24 border-2 ${
          theme === Theme.Light
            ? "bg-accented_background-light border-border-light text-foreground-light"
            : "bg-accented_background-dark border-border-dark text-foreground-dark"
        } p-4 gap-2`}
        style={{
          maxWidth: "80vw",
          maxHeight: "60vh",
        }}
      >
        <CloseIcon
          onPress={() => {
            dispatch(setSettingsExpanded(false));
          }}
        />
        {premiumComponents.get("advancedChords") as ReactNode}
        <SwitchToChromaticScaleCheckbox />
        <UseSharpChordsCheckbox />
        <UseChordAlterationCheckbox />
        {
          premiumComponents.get(
            "toggleMetronomeWhenRecordingCheckbox"
          ) as ReactNode
        }
        {premiumComponents.get("instruments") as ReactNode}
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
          <ChordPlayModeSelector />
          {premiumComponents.get("skinSelection") as ReactNode}
          {premiumComponents.get("playbackTypeSelection") as ReactNode}
          <TempoSlider />
          <ChordStrummingDelaySlider />
          <ChordNotesToPlaySlider />
          <VelocitySlider />
          <MetronomeVelocitySlider />
          {!isMobileDevice() &&
            (premiumComponents.get("reverbStrength") as ReactNode)}
        </div>
      </section>
    </Slide>
  );
};
SettingsView.displayName = "SettingsView";
