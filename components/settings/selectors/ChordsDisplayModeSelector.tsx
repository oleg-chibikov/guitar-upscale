import React from "react";
import { useDispatch, useSelector } from "react-redux";
import { ChordsDisplayMode } from "../../../data/chordsDisplayMode";
import {
  selectControlPanel,
  setSelectedChordsDisplayMode,
} from "../../../store/controlPanelSlice";
import { EnumSelector } from "./EnumSelector";

export const ChordsDisplayModeSelector: React.FC = () => {
  const { selectedChordsDisplayMode } = useSelector(selectControlPanel);
  const dispatch = useDispatch();

  return (
    <EnumSelector
      enumObj={ChordsDisplayMode}
      selectedValue={selectedChordsDisplayMode}
      onValueChange={(value) => {
        dispatch(setSelectedChordsDisplayMode(value));
      }}
    />
  );
};
