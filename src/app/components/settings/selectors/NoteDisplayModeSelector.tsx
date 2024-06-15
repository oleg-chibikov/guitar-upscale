import { NoteDisplayMode } from "@/app/data/noteDisplayMode";
import { selectUi, setNoteDisplayMode } from "@/app/store/uiSlice";
import { Typography } from "@mui/material";
import React from "react";
import { useDispatch, useSelector } from "react-redux";
import { EnumSelector } from "./EnumSelector";

export const NoteDisplayModeSelector: React.FC = () => {
  const { noteDisplayMode } = useSelector(selectUi);
  const dispatch = useDispatch();

  return (
    <>
      <Typography variant="body2">Note display mode:</Typography>
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
