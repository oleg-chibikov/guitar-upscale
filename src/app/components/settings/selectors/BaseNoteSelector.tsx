import { getShiftedNote } from "@/app/data/tunings";
import React from "react";
import { useDispatch, useSelector } from "react-redux";
import { Note, getNoteText } from "../../../data/notes";
import { selectSettings, setBaseNote } from "../../../store/settingsSlice";
import { EnumSelector } from "./EnumSelector";

export const BaseNoteSelector: React.FC = () => {
  const { baseNote } = useSelector(selectSettings);
  const dispatch = useDispatch();

  return (
    <>
      <span>Base Note / Capo:</span>
      <EnumSelector
        enumObj={Note}
        selectedValue={baseNote}
        onValueChange={(value) => {
          dispatch(setBaseNote(value));
        }}
        customLabel={(_, value) => {
          const note = getShiftedNote(value);
          return (
            getNoteText(note) + "(" + (value === 0 ? "" : "+") + value + ")"
          );
        }}
      />
    </>
  );
};
