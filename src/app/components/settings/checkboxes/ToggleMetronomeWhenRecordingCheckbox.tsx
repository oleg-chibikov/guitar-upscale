"use client";
import {
  selectSettings,
  setToggleMetronomeWhenRecording,
} from "@/app/store/settingsSlice";
import React from "react";
import { useDispatch, useSelector } from "react-redux";
import { CheckBox } from "../../uiFramework/CheckBox";

export const ToggleMetronomeWhenRecordingCheckbox: React.FC = (props) => {
  const { toggleMetronomeWhenRecording } = useSelector(selectSettings);
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
