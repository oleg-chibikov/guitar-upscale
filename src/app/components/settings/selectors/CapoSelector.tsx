import { Note, getNoteText } from "@/app/data/notes";
import { getShiftedNote } from "@/app/data/tunings";
import {
  selectSettings,
  setCapo,
  tuningValue,
} from "@/app/store/settingsSlice";
import React from "react";
import { useDispatch, useSelector } from "react-redux";
import { EnumSelector } from "../../uiFramework/EnumSelector";

export const CapoSelector: React.FC = () => {
  const { capo } = useSelector(selectSettings);
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
