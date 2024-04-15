import QueueMusic from "@mui/icons-material/QueueMusic";
import React from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  selectControlPanel,
  setChordsExpanded,
  setScale,
  setScaleGroup,
} from "../../../store/controlPanelSlice";
import { IconButton } from "./IconButton";

export const OpenChordsButton: React.FC = (props) => {
  const dispatch = useDispatch();
  const { chordsExpanded, switchToChromaticScale } =
    useSelector(selectControlPanel);
  return (
    <IconButton
      {...props}
      icon={<QueueMusic />}
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
