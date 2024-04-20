import React from "react";
import { useDispatch, useSelector } from "react-redux";
import { NoteDisplayMode } from "../../../data/noteDisplayMode";
import {
  selectControlPanel,
  setNoteDisplayMode,
} from "../../../store/controlPanelSlice";
import { EnumSelector } from "./EnumSelector";

export const NoteDisplayModeSelector: React.FC = () => {
  const { noteDisplayMode } = useSelector(selectControlPanel);
  const dispatch = useDispatch();

  return (
    <>
      <span>Note Display Mode:</span>
      <EnumSelector
        enumObj={NoteDisplayMode}
        selectedValue={noteDisplayMode}
        onValueChange={(value) => {
          dispatch(setNoteDisplayMode(value));
        }}
      />
    </>
  );
};
