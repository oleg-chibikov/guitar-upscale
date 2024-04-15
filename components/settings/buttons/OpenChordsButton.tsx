import React from "react";
import { PressableProps } from "react-native";
import { useDispatch, useSelector } from "react-redux";
import {
  selectControlPanel,
  setChordsExpanded,
  setScale,
  setScaleGroup,
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
      tooltip={chordsExpanded ? "Close chords panel" : "Open chords panel"}
      isActive={chordsExpanded}
      onPress={() => {
        if (switchToChromaticScale && !chordsExpanded) {
          dispatch(setScaleGroup("Special"));
          dispatch(setScale("Chromatic (All notes)"));
        }
        dispatch(setChordsExpanded(!chordsExpanded));
      }}
    />
  );
};
