import { ResetSettingsButton } from "@/app/components/settings/buttons/ResetSettingsButton";
import { ChordsDisplayMode } from "@/app/data/chordsDisplayMode";
import { SETTINGS_PANEL_ID } from "@/app/data/elementIds";
import { Theme } from "@/app/data/theme";
import { isMobileDeviceValue } from "@/app/helpers/deviceHelper";
import { WithPremiumComponents } from "@/app/helpers/withPremiumFeatures";
import { selectUi, setSettingsExpanded } from "@/app/store/uiSlice";
import { Drawer } from "@mui/material";
import { ReactNode, useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { CloseIcon } from "../CloseIcon";
import { UseChordAlterationCheckbox } from "./checkboxes/UseChordAlterationCheckbox";
import { UseSharpChordsCheckbox } from "./checkboxes/UseSharpChordsChekbox";
import { ChordPlayModeSelector } from "./selectors/ChordPlayModeSelector";
import { ChordsDisplayModeSelector } from "./selectors/ChordsDisplayModeSelector";
import { NoteDisplayModeSelector } from "./selectors/NoteDisplayModeSelector";
import { ThemeSelector } from "./selectors/ThemeSelector";
import { ChordNotesToPlaySlider } from "./sliders/ChordNotesToPlaySlider";
import { MetronomeVolumeSlider } from "./sliders/MetronomeVolumeSlider";
import { VolumeSlider } from "./sliders/VolumeSlider";

export const SettingsView: React.FC<WithPremiumComponents> = ({
  premiumComponents,
}) => {
  const { theme, chordsDisplayMode, settingsExpanded } = useSelector(selectUi);
  const dispatch = useDispatch();
  const [open, setOpen] = useState<boolean>(false); // this is needed to use animation when loaded first time

  useEffect(() => {
    setOpen(settingsExpanded);
  }, [settingsExpanded]);

  return (
    <Drawer
      anchor={chordsDisplayMode === ChordsDisplayMode.Left ? "right" : "left"}
      open={open}
      onClose={() => dispatch(setSettingsExpanded(false))}
    >
      <div
        id={SETTINGS_PANEL_ID}
        className={`flex flex-col overflow-auto overscroll-contain border-2 h-full ${
          theme === Theme.Light
            ? "bg-accented_background-light border-border-light text-foreground-light"
            : "bg-accented_background-dark border-border-dark text-foreground-dark"
        } p-4 gap-2`}
        style={{
          maxWidth: "80vw",
        }}
      >
        <CloseIcon
          onPress={() => {
            dispatch(setSettingsExpanded(false));
          }}
        />
        {premiumComponents.get("advancedChords") as ReactNode}
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
          <NoteDisplayModeSelector />
          <ChordsDisplayModeSelector />
          <ChordPlayModeSelector />
          {premiumComponents.get("skinSelection") as ReactNode}
          {premiumComponents.get("playbackTypeSelection") as ReactNode}
          {/* <TempoSlider />
          <ChordStrummingDelaySlider /> */}
          <ChordNotesToPlaySlider />
          <VolumeSlider />
          <MetronomeVolumeSlider />
          {!isMobileDeviceValue &&
            (premiumComponents.get("reverbStrength") as ReactNode)}
          <ResetSettingsButton />
        </div>
      </div>
    </Drawer>
  );
};

SettingsView.displayName = "SettingsView";
