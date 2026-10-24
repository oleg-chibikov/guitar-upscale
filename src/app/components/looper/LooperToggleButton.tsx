import { IconButtonWrapper } from "@/app/components/uiFramework/IconButton";
import { useSettingsSelector, useUiSelector } from "@/app/hooks/storeHooks";
import { setLooperExpanded } from "@/app/store/uiSlice";
import Loop from "@mui/icons-material/Loop";
import React from "react";
import { useDispatch } from "react-redux";

export const LooperToggleButton: React.FC = () => {
  const dispatch = useDispatch();
  const looperExpanded = useUiSelector((s) => s.looperExpanded);
  const isLooperPlaying = useSettingsSelector((s) => s.isLooperPlaying);
  return (
    <IconButtonWrapper
      // pulses so a loop playing behind the closed panel isn't forgotten
      className={isLooperPlaying && !looperExpanded ? "animate-pulse" : ""}
      icon={<Loop />}
      tooltip="Looper"
      isActive={looperExpanded || isLooperPlaying}
      onPress={() => dispatch(setLooperExpanded(!looperExpanded))}
    />
  );
};
