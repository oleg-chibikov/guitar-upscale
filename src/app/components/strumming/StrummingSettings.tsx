import { ChordStrummingImmediateGracePeriodSlider } from "@/app/components/settings/sliders/ChordStrummingImmediateGracePeriodSlider";
import { StrummingPatternDialogWrapper } from "@/app/components/strumming/StrummingPatternDialogWrapper";
import { DialogWrapper } from "@/app/components/uiFramework/DialogWrapper";
import { STRUMMING_SETTINGS_PANEL_ID } from "@/app/data/elementIds";
import { selectUi, setStrummingSettingsExpanded } from "@/app/store/uiSlice";
import { Alert } from "@mui/material";
import { FC } from "react";
import { useDispatch, useSelector } from "react-redux";
import { SeamlessChordSwitchingCheckbox } from "../settings/checkboxes/SeamlessChordSwitchingCheckbox";
import { WaitForPatternFinishCheckbox } from "../settings/checkboxes/WaitForPatternFinishCheckbox";
import { StrummingPatternSelector } from "./StrummingPatternSelector";

export const StrummingSettings: FC = () => {
  const dispatch = useDispatch();
  const { strummingSettingsExpanded } = useSelector(selectUi);
  const close = () => dispatch(setStrummingSettingsExpanded(false));

  return (
    <DialogWrapper
      anchor="bottom"
      isOpen={strummingSettingsExpanded}
      close={close}
      id={STRUMMING_SETTINGS_PANEL_ID}
    >
      <WaitForPatternFinishCheckbox />
      <SeamlessChordSwitchingCheckbox />
      <ChordStrummingImmediateGracePeriodSlider />
      <Alert severity="info">Long press the chord to strum</Alert>
      <StrummingPatternSelector />
      <StrummingPatternDialogWrapper />
    </DialogWrapper>
  );
};
