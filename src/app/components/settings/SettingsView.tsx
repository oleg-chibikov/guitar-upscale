import { WithPremiumComponents } from "@/app/helpers/WithPremiumFeatures";
import { Slide } from "@mui/material";
import { ReactNode, forwardRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { ChordsDisplayMode } from "../../data/chordsDisplayMode";
import {
  Theme,
  selectControlPanel,
  setSettingsExpanded,
} from "../../store/controlPanelSlice";
import { CloseIcon } from "../CloseIcon";
import { SwitchToChromaticScaleCheckbox } from "./checkboxes/SwitchToChromaticScaleCheckbox";
import { UseAdvancedChordsCheckbox } from "./checkboxes/UseAdvancedChordsChekbox";
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

export const SettingsView = forwardRef<HTMLDivElement, WithPremiumComponents>(
  ({ premiumComponents }, ref) => {
    const { theme, chordsDisplayMode, settingsExpanded } =
      useSelector(selectControlPanel);
    const dispatch = useDispatch();
    return (
      <Slide direction="down" in={settingsExpanded} mountOnEnter unmountOnExit>
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
          <CloseIcon
            onPress={() => {
              dispatch(setSettingsExpanded(false));
            }}
          />
          <UseAdvancedChordsCheckbox />
          <SwitchToChromaticScaleCheckbox />
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
            {premiumComponents.get("advancedChords") as ReactNode}
            <TempoSlider />
            <ChordStrummingDelaySlider />
            <ChordNotesToPlaySlider />
            <VelocitySlider />
            <MetronomeVelocitySlider />
          </div>
        </section>
      </Slide>
    );
  }
);
SettingsView.displayName = "SettingsView";
