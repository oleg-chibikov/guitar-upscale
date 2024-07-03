import { Note, getNoteText } from "@/app/data/notes";
import { getShiftedNote } from "@/app/data/tunings";
import { useSettingsSelector } from "@/app/hooks/storeHooks";
import { setCapo, tuningValue } from "@/app/store/settingsSlice";
import React from "react";
import { useDispatch } from "react-redux";
import { EnumSelector } from "../../uiFramework/EnumSelector";

export const CapoSelector: React.FC = () => {
  const capo = useSettingsSelector((s) => s.capo);
  const dispatch = useDispatch();

  return (
    <EnumSelector
      enumObj={Note}
      selectedValue={capo}
      onValueChange={(value) => {
        dispatch(setCapo(value));
      }}
      customLabel={(_, value) => {
        const note = getShiftedNote(value, tuningValue);
        return getNoteText(note) + "(" + (value === 0 ? "" : "+") + value + ")";
      }}
    />
  );
};
