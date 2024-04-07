import React from "react";
import { useDispatch } from "react-redux";
import { NoteDisplayMode } from "../data/noteDisplayMode";
import { setSelectedNoteDisplayMode } from "../store/controlPanelSlice";
import { useAppSelector } from "../store/store";
import EnumSelector from "./EnumSelector";

const NoteDisplayModeSelector: React.FC = () => {
  const { selectedNoteDisplayMode } = useAppSelector(
    (state) => state.controlPanel
  );
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

export default NoteDisplayModeSelector;
