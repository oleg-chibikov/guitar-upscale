import { DialogContentWrapper } from "@/app/components/layout/DialogContentWrapper";
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
      <DialogContentWrapper
        id={SETTINGS_PANEL_ID}
        className={`h-full`}
        style={{
          maxWidth: "80vw",
        }}
        onClose={() => {
          dispatch(setSettingsExpanded(false));
        }}
      >
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
      </DialogContentWrapper>
    </Drawer>
  );
};

SettingsView.displayName = "SettingsView";
