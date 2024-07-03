"use client";
import { useSettingsSelector } from "@/app/hooks/storeHooks";
import {
  PauseResolveValue,
  moveCurrentPlayPosition,
} from "@/app/store/settingsSlice";
import ChevronRight from "@mui/icons-material/ChevronRight";
import React from "react";
import { IconButtonWrapper } from "../uiFramework/IconButton";

export const NextEventButton: React.FC = () => {
  const isLooperPlaying = useSettingsSelector((s) => s.isLooperPlaying);
  const isLastEvent = useSettingsSelector((s) => s.isLastEvent);
  const isPaused = useSettingsSelector((s) => s.isPaused);
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
