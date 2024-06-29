import { DialogContentWrapper } from "@/app/components/layout/DialogContentWrapper";
import { StrummingPatternDialogWrapper } from "@/app/components/strumming/StrummingPatternDialogWrapper";
import { STRUMMING_SETTINGS_PANEL_ID } from "@/app/data/elementIds";
import { selectUi, setStrummingSettingsExpanded } from "@/app/store/uiSlice";
import { Alert } from "@mui/material";
import Drawer from "@mui/material/Drawer";
import { FC, useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { SeamlessChordSwitchingCheckbox } from "../settings/checkboxes/SeamlessChordSwitchingCheckbox";
import { WaitForPatternFinishCheckbox } from "../settings/checkboxes/WaitForPatternFinishCheckbox";
import { StrummingPatternSelector } from "./StrummingPatternSelector";

export const StrummingSettings: FC = () => {
  const dispatch = useDispatch();
  const { strummingSettingsExpanded } = useSelector(selectUi);
  const [open, setOpen] = useState<boolean>(false); // this is needed to use animation when loaded first time

  useEffect(() => {
    setOpen(strummingSettingsExpanded);
  }, [strummingSettingsExpanded]);

  return (
    <Drawer
      anchor="bottom"
      open={open}
      onClose={() => dispatch(setStrummingSettingsExpanded(false))}
    >
      <DialogContentWrapper
        id={STRUMMING_SETTINGS_PANEL_ID}
        onClose={() => {
          dispatch(setStrummingSettingsExpanded(false));
        }}
      >
        <WaitForPatternFinishCheckbox />
        <SeamlessChordSwitchingCheckbox />
        <Alert severity="info">Long press the chord to strum</Alert>
        <StrummingPatternSelector />
        <StrummingPatternDialogWrapper />
      </DialogContentWrapper>
    </Drawer>
  );
};
