import React from "react";
import { useDispatch, useSelector } from "react-redux";
import { NoteDisplayMode } from "../../data/noteDisplayMode";
import {
  selectControlPanel,
  setSelectedNoteDisplayMode,
} from "../../store/controlPanelSlice";
import { EnumSelector } from "../core/EnumSelector";

export const NoteDisplayModeSelector: React.FC = () => {
  const { selectedNoteDisplayMode } = useSelector(selectControlPanel);
  const dispatch = useDispatch();

  return (
    <EnumSelector
      enumObj={NoteDisplayMode}
      selectedValue={selectedNoteDisplayMode}
      onValueChange={(value) => {
        dispatch(setSelectedNoteDisplayMode(value));
      }}
    />
  );
};
