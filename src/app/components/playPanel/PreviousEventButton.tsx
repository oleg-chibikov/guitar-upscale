"use client";
import {
  PauseResolveValue,
  moveCurrentPlayPosition,
  selectSettings,
} from "@/app/store/settingsSlice";
import ChevronLeft from "@mui/icons-material/ChevronLeft";
import React from "react";
import { useSelector } from "react-redux";
import { IconButton } from "../settings/buttons/IconButton";

export const PreviousEventButton: React.FC = () => {
  const { isPaused, playerEventIndex } = useSelector(selectSettings);
  if (!isPaused) {
    return null;
  }
  return (
    <IconButton
      disabled={!isPaused || playerEventIndex <= 1}
      isActive={false}
      tooltip={"Previous event"}
      icon={<ChevronLeft />}
      onPress={() => {
        moveCurrentPlayPosition(PauseResolveValue.GoBack);
      }}
    />
  );
};
