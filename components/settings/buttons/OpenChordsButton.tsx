import React from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  selectControlPanel,
  setChordsExpanded,
  setSelectedScale,
  setSelectedScaleGroup,
} from "../../../store/controlPanelSlice";
import { IconButton } from "../../IconButton";

export const OpenChordsButton: React.FC = () => {
  const dispatch = useDispatch();
  const { chordsExpanded, switchToChromaticScale, bg } =
    useSelector(selectControlPanel);
  return (
    <IconButton
      icon="🎶"
      onPress={() => {
        if (switchToChromaticScale && !chordsExpanded) {
          dispatch(setSelectedScaleGroup("Rare"));
          dispatch(setSelectedScale("Chromatic (All notes)"));
        }
        dispatch(setChordsExpanded(!chordsExpanded));
      }}
    />
  );
};
