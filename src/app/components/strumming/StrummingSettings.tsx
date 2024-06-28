import { StrummingPatternEditor } from "@/app/components/strumming/StrummingPatternEditor";
import { STRUMMING_SETTINGS_PANEL_ID } from "@/app/data/elementIds";
import { Theme } from "@/app/data/theme";
import { selectUi, setStrummingSettingsExpanded } from "@/app/store/uiSlice";
import { Alert } from "@mui/material";
import Drawer from "@mui/material/Drawer";
import { FC, useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { CloseIcon } from "../CloseIcon";
import { ChordCustomStrummingWaitForPatternFinishCheckbox } from "../settings/checkboxes/ChordCustomStrummingWaitForPatternFinishCheckbox";
import { SeamlessChordSwitchingCheckbox } from "../settings/checkboxes/SeamlessChordSwitchingCheckbox";
import { StrummingPatternSelector } from "./StrummingPatternSelector";

export const StrummingSettings: FC = () => {
  const dispatch = useDispatch();
  const { theme, strummingSettingsExpanded } = useSelector(selectUi);
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
      <div
        id={STRUMMING_SETTINGS_PANEL_ID}
        className={`flex flex-col gap-2 p-4 ${
          theme === Theme.Light
            ? "bg-accented_background-light text-foreground-light"
            : "bg-accented_background-dark text-foreground-dark"
        }`}
      >
        <CloseIcon
          onPress={() => {
            dispatch(setStrummingSettingsExpanded(false));
          }}
        />
        <ChordCustomStrummingWaitForPatternFinishCheckbox />
        <SeamlessChordSwitchingCheckbox />
        <Alert severity="info">Long press the chord to strum</Alert>
        <StrummingPatternSelector />
        <StrummingPatternEditor />
      </div>
    </Drawer>
  );
};
