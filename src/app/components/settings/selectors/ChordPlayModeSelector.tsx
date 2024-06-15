import { ChordPlayMode } from "@/app/data/chordPlayMode";
import { selectSettings, setChordPlayMode } from "@/app/store/settingsSlice";
import { Typography } from "@mui/material";
import React from "react";
import { useDispatch, useSelector } from "react-redux";
import { EnumSelector } from "./EnumSelector";

export const ChordPlayModeSelector: React.FC = () => {
  const { chordPlayMode } = useSelector(selectSettings);
  const dispatch = useDispatch();

  return (
    <>
      <Typography variant="body2">Chord play mode:</Typography>
      <EnumSelector
        enumObj={ChordPlayMode}
        selectedValue={chordPlayMode}
        onValueChange={(value) => {
          dispatch(setChordPlayMode(value));
        }}
      />
    </>
  );
};
