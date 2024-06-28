"use client";
import {
  PauseResolveValue,
  moveCurrentPlayPosition,
  selectSettings,
} from "@/app/store/settingsSlice";
import ChevronLeft from "@mui/icons-material/ChevronLeft";
import React from "react";
import { useSelector } from "react-redux";
import { IconButtonWrapper } from "../settings/buttons/IconButton";

export const PreviousEventButton: React.FC = () => {
  const { isPaused, isFirstEvent, isLooperPlaying } =
    useSelector(selectSettings);
  if (!isPaused || isLooperPlaying) {
    return null;
  }
  return (
    <IconButtonWrapper
      disabled={!isPaused || isFirstEvent}
      isActive={false}
      tooltip={"Previous event"}
      icon={<ChevronLeft />}
      onPress={() => {
        moveCurrentPlayPosition(PauseResolveValue.GoBack);
      }}
    />
  );
};
