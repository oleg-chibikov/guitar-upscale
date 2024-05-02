"use client";
import React from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  selectSettings,
  setToggleMetronomeWhenRecording,
} from "../../../store/settingsSlice";
import { CheckBox } from "./CheckBox";

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
