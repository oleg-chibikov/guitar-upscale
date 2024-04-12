import React from "react";
import { useDispatch, useSelector } from "react-redux";
import { ChordPlayMode } from "../../../data/chordPlayMode";
import {
  selectControlPanel,
  setChordPlayMode,
} from "../../../store/controlPanelSlice";
import { EnumSelector } from "./EnumSelector";

export const ChordPlayModeSelector: React.FC = () => {
  const { chordPlayMode } = useSelector(selectControlPanel);
  const dispatch = useDispatch();

  return (
    <EnumSelector
      enumObj={ChordPlayMode}
      selectedValue={chordPlayMode}
      onValueChange={(value) => {
        dispatch(setChordPlayMode(value));
      }}
    />
  );
};
