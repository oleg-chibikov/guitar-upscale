"use client";
import { useSettingsSelector } from "@/app/hooks/storeHooks";
import { setSaveMidiImmediately } from "@/app/store/settingsSlice";
import React from "react";
import { useDispatch } from "react-redux";
import { CheckBox } from "../../uiFramework/CheckBox";

export const SaveMidiImmediatelyCheckbox: React.FC = (props) => {
  const saveMidiImmediately = useSettingsSelector((s) => s.saveMidiImmediately);
  const dispatch = useDispatch();

  return (
    <CheckBox
      {...props}
      label="Save MIDI file immediately after recording"
      value={saveMidiImmediately}
      onValueChange={(value: boolean) =>
        dispatch(setSaveMidiImmediately(value))
      }
    />
  );
};
