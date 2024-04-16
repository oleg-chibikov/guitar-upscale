import React from "react";
import { useDispatch, useSelector } from "react-redux";
import { Note } from "../../../data/notes";
import {
  selectControlPanel,
  setBaseNote,
} from "../../../store/controlPanelSlice";
import { EnumSelector } from "./EnumSelector";

export const BaseNoteSelector: React.FC = () => {
  const { baseNote } = useSelector(selectControlPanel);
  const dispatch = useDispatch();

  return (
    <EnumSelector
      enumObj={Note}
      selectedValue={baseNote}
      onValueChange={(value) => {
        dispatch(setBaseNote(value));
      }}
      customLabel={(key, value) =>
        key + "(" + (value === 0 ? "" : "+") + value + ")"
      }
    />
  );
};
