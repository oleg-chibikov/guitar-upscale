import React from "react";
import { useDispatch, useSelector } from "react-redux";
import { Note } from "../../data/notes";
import {
  selectControlPanel,
  setSelectedBaseNote,
} from "../../store/controlPanelSlice";
import { EnumSelector } from "../core/EnumSelector";

export const BaseNoteSelector: React.FC = () => {
  const { selectedBaseNote } = useSelector(selectControlPanel);
  const dispatch = useDispatch();

  return (
    <EnumSelector
      enumObj={Note}
      selectedValue={selectedBaseNote}
      onValueChange={(value) => {
        dispatch(setSelectedBaseNote(value));
      }}
      customLabel={(key, value) =>
        key + "(" + (value === 0 ? "" : "+") + value + ")"
      }
    />
  );
};
