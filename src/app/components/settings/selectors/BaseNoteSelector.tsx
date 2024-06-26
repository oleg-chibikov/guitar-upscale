import { Note, getNoteText } from "@/app/data/notes";
import { getShiftedNote } from "@/app/data/tunings";
import {
  selectSettings,
  setBaseNote,
  tuningValue,
} from "@/app/store/settingsSlice";
import React from "react";
import { useDispatch, useSelector } from "react-redux";
import { EnumSelector } from "./EnumSelector";

export const BaseNoteSelector: React.FC = () => {
  const { baseNote } = useSelector(selectSettings);
  const dispatch = useDispatch();

  return (
    <EnumSelector
      large
      enumObj={Note}
      selectedValue={baseNote}
      onValueChange={(value) => {
        dispatch(setBaseNote(value));
      }}
      customLabel={(_, value) => {
        const note = getShiftedNote(value, tuningValue);
        return getNoteText(note) + "(" + (value === 0 ? "" : "+") + value + ")";
      }}
    />
  );
};
