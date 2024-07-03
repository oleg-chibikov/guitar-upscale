"use client";
import { useSettingsSelector } from "@/app/hooks/storeHooks";
import {
  PauseResolveValue,
  moveCurrentPlayPosition,
} from "@/app/store/settingsSlice";
import ChevronLeft from "@mui/icons-material/ChevronLeft";
import React from "react";
import { IconButtonWrapper } from "../uiFramework/IconButton";

export const PreviousEventButton: React.FC = () => {
  const isLooperPlaying = useSettingsSelector((s) => s.isLooperPlaying);
  const isFirstEvent = useSettingsSelector((s) => s.isFirstEvent);
  const isPaused = useSettingsSelector((s) => s.isPaused);
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
