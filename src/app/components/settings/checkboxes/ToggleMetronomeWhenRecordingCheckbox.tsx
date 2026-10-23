"use client";
import { useSettingsSelector } from "@/app/hooks/storeHooks";
import { setToggleMetronomeWhenRecording } from "@/app/store/settingsSlice";
import React from "react";
import { useDispatch } from "react-redux";
import { CheckBox } from "../../uiFramework/CheckBox";

export const ToggleMetronomeWhenRecordingCheckbox: React.FC = (props) => {
  const toggleMetronomeWhenRecording = useSettingsSelector(
    (s) => s.toggleMetronomeWhenRecording,
  );
  const dispatch = useDispatch();

  return (
    <CheckBox
      {...props}
      label="Start metronome when recording"
      value={toggleMetronomeWhenRecording}
      onValueChange={(value: boolean) =>
        dispatch(setToggleMetronomeWhenRecording(value))
      }
    />
  );
};
