import { ResetSettingsButton } from "@/app/components/settings/buttons/ResetSettingsButton";
import { DialogWrapper } from "@/app/components/uiFramework/DialogWrapper";
import { ChordsDisplayMode } from "@/app/data/chordsDisplayMode";
import { SETTINGS_PANEL_ID } from "@/app/data/elementIds";
import { Theme } from "@/app/data/theme";
import { isMobileDeviceValue } from "@/app/helpers/deviceHelper";
import { WithPremiumComponents } from "@/app/helpers/withPremiumFeatures";
import { useUiSelector } from "@/app/hooks/storeHooks";
import { setSettingsExpanded } from "@/app/store/uiSlice";
import { useDispatch } from "react-redux";
import { HighStringAtBottomCheckbox } from "./checkboxes/HighStringAtBottomCheckbox";
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
  const theme = useUiSelector((s) => s.theme);
  const chordsDisplayMode = useUiSelector((s) => s.chordsDisplayMode);
  const settingsExpanded = useUiSelector((s) => s.settingsExpanded);
  const dispatch = useDispatch();
  const close = () => dispatch(setSettingsExpanded(false));

  return (
    <DialogWrapper
      anchor={chordsDisplayMode === ChordsDisplayMode.Left ? "right" : "left"}
      isOpen={settingsExpanded}
      close={close}
      id={SETTINGS_PANEL_ID}
      headerText="Settings"
      className="h-full"
      contentClassName="flexGrow overflow-y-auto"
    >
      <UseSharpChordsCheckbox />
      <UseChordAlterationCheckbox />
      {premiumComponents.get("toggleMetronomeWhenRecordingCheckbox")}
      {premiumComponents.get("saveMidiImmediatelyCheckbox")}
      <HighStringAtBottomCheckbox />
      {premiumComponents.get("instruments")}
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
        {premiumComponents.get("skinSelection")}
        {premiumComponents.get("playbackTypeSelection")}
        <ChordNotesToPlaySlider />
        <VolumeSlider />
        <MetronomeVolumeSlider />
        {!isMobileDeviceValue && premiumComponents.get("reverbStrength")}
        <ResetSettingsButton />
      </div>
    </DialogWrapper>
  );
};

SettingsView.displayName = "SettingsView";
