import { ChordStrummingInterval } from "@/app/data/chordStrummingInterval";
import {
  selectSettings,
  setChordStrummingInterval,
} from "@/app/store/settingsSlice";
import { Typography } from "@mui/material";
import React from "react";
import { useDispatch, useSelector } from "react-redux";
import { EnumSelector } from "./EnumSelector";

export const ChordStrummingIntervalSelector: React.FC = () => {
  const { chordStrummingInterval } = useSelector(selectSettings);
  const dispatch = useDispatch();

  return (
    <>
      <Typography variant="body2">Chord Strumming Interval:</Typography>
      <EnumSelector
        enumObj={ChordStrummingInterval}
        selectedValue={chordStrummingInterval}
        onValueChange={(value) => {
          dispatch(setChordStrummingInterval(value));
        }}
      />
    </>
  );
};
