import { ControlWithLabel } from "@/app/components/uiFramework/ControlWithLabel";
import { ChordPlayMode } from "@/app/data/chordPlayMode";
import { useSettingsSelector } from "@/app/hooks/storeHooks";
import { setChordPlayMode } from "@/app/store/settingsSlice";
import React from "react";
import { useDispatch } from "react-redux";
import { EnumSelector } from "../../uiFramework/EnumSelector";

export const ChordPlayModeSelector: React.FC = () => {
  const chordPlayMode = useSettingsSelector((s) => s.chordPlayMode);
  const dispatch = useDispatch();

  return (
    <ControlWithLabel label="Chord play mode">
      <EnumSelector
        enumObj={ChordPlayMode}
        selectedValue={chordPlayMode}
        onValueChange={(value) => {
          dispatch(setChordPlayMode(value));
        }}
      />
    </ControlWithLabel>
  );
};
