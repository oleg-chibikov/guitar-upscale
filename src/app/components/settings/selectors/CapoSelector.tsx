import { Note, getNoteText } from "@/app/data/notes";
import { getShiftedNote } from "@/app/data/tunings";
import { useSettingsSelector } from "@/app/hooks/storeHooks";
import { setCapo } from "@/app/store/settingsSlice";
import React from "react";
import { useDispatch } from "react-redux";
import { EnumSelector } from "../../uiFramework/EnumSelector";

export const CapoSelector: React.FC = () => {
  const capo = useSettingsSelector((s) => s.capo);
  const tuning = useSettingsSelector((s) => s.tuning);
  const dispatch = useDispatch();

  return (
    <EnumSelector
      enumObj={Note}
      selectedValue={capo}
      onValueChange={(value) => {
        dispatch(setCapo(value));
      }}
      customLabel={(_, value) => {
        if (value === 0) {
          return "No capo";
        }
        // the note is the root the capo gives
        const note = getShiftedNote(value, tuning);
        return `Fret ${value} (${getNoteText(note)})`;
      }}
    />
  );
};
