import React from "react";
import { PressableProps } from "react-native";
import { useDispatch, useSelector } from "react-redux";
import {
  selectControlPanel,
  setChordsExpanded,
  setSelectedScale,
  setSelectedScaleGroup,
} from "../../../store/controlPanelSlice";
import { IconButton } from "./IconButton";

export const OpenChordsButton: React.FC<PressableProps> = (props) => {
  const dispatch = useDispatch();
  const { chordsExpanded, switchToChromaticScale } =
    useSelector(selectControlPanel);
  return (
    <IconButton
      {...props}
      icon="queue-music"
      isActive={chordsExpanded}
      onPress={() => {
        if (switchToChromaticScale && !chordsExpanded) {
          dispatch(setSelectedScaleGroup("Special"));
          dispatch(setSelectedScale("Chromatic (All notes)"));
        }
        dispatch(setChordsExpanded(!chordsExpanded));
      }}
    />
  );
};
