"use client";
import {
  PauseResolveValue,
  moveCurrentPlayPosition,
  selectSettings,
} from "@/app/store/settingsSlice";
import ChevronRight from "@mui/icons-material/ChevronRight";
import React from "react";
import { useSelector } from "react-redux";
import { IconButtonWrapper } from "../settings/buttons/IconButton";

export const NextEventButton: React.FC = () => {
  const { isPaused, isLastEvent, isLooperPlaying } =
    useSelector(selectSettings);
  if (!isPaused || isLooperPlaying) {
    return null;
  }
  return (
    <IconButtonWrapper
      disabled={!isPaused || isLastEvent}
      isActive={false}
      tooltip={"Next event"}
      icon={<ChevronRight />}
      onPress={() => {
        moveCurrentPlayPosition(PauseResolveValue.GoForward);
      }}
    />
  );
};
