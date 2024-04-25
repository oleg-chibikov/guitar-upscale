import { ChordStrummingMode } from "@/app/data/chordStrummingMode";
import React from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  selectSettings,
  setChordStrummingMode,
} from "../../../store/settingsSlice";
import { EnumSelector } from "./EnumSelector";

export const ChordStrummingModeSelector: React.FC = () => {
  const { chordStrummingMode } = useSelector(selectSettings);
  const dispatch = useDispatch();

  return (
    <>
      <span>Chord Strumming Mode:</span>
      <EnumSelector
        enumObj={ChordStrummingMode}
        selectedValue={chordStrummingMode}
        onValueChange={(value) => {
          dispatch(setChordStrummingMode(value));
        }}
      />
    </>
  );
};
