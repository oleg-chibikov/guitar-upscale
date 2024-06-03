"use client";
import {
  PauseResolveValue,
  moveCurrentPlayPosition,
  selectSettings,
} from "@/app/store/settingsSlice";
import ChevronRight from "@mui/icons-material/ChevronRight";
import React from "react";
import { useSelector } from "react-redux";
import { IconButton } from "../settings/buttons/IconButton";

export const NextEventButton: React.FC = () => {
  const { isPaused, playerEventIndex, playerEventCount } =
    useSelector(selectSettings);
  if (!isPaused) {
    return null;
  }
  return (
    <IconButton
      disabled={!isPaused || playerEventIndex === playerEventCount - 1}
      isActive={false}
      tooltip={"Next event"}
      icon={<ChevronRight />}
      onPress={() => {
        moveCurrentPlayPosition(PauseResolveValue.GoForward);
      }}
    />
  );
};
