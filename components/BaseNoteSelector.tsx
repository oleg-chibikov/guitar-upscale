import React from "react";
import { useDispatch } from "react-redux";
import { Note } from "../data/notes";
import { setSelectedBaseNote } from "../store/controlPanelSlice";
import { useAppSelector } from "../store/store";
import EnumSelector from "./EnumSelector";

const BaseNoteSelector: React.FC = () => {
  const { selectedBaseNote } = useAppSelector((state) => state.controlPanel);
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

export default BaseNoteSelector;
