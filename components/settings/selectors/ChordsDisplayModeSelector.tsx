import React from "react";
import { useDispatch, useSelector } from "react-redux";
import { ChordsDisplayMode } from "../../../data/chordsDisplayMode";
import {
  selectControlPanel,
  setChordsDisplayMode,
} from "../../../store/controlPanelSlice";
import { EnumSelector } from "./EnumSelector";

export const ChordsDisplayModeSelector: React.FC = () => {
  const { chordsDisplayMode } = useSelector(selectControlPanel);
  const dispatch = useDispatch();

  return (
    <EnumSelector
      enumObj={ChordsDisplayMode}
      selectedValue={chordsDisplayMode}
      onValueChange={(value) => {
        dispatch(setChordsDisplayMode(value));
      }}
    />
  );
};
