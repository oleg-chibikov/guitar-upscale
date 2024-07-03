import { ControlWithLabel } from "@/app/components/uiFramework/ControlWithLabel";
import { ChordsDisplayMode } from "@/app/data/chordsDisplayMode";
import { useUiSelector } from "@/app/hooks/storeHooks";
import { setChordsDisplayMode } from "@/app/store/uiSlice";
import React from "react";
import { useDispatch } from "react-redux";
import { EnumSelector } from "../../uiFramework/EnumSelector";

export const ChordsDisplayModeSelector: React.FC = () => {
  const chordsDisplayMode = useUiSelector((s) => s.chordsDisplayMode);
  const dispatch = useDispatch();

  return (
    <ControlWithLabel label="Chords display mode">
      <EnumSelector
        enumObj={ChordsDisplayMode}
        selectedValue={chordsDisplayMode}
        onValueChange={(value) => {
          dispatch(setChordsDisplayMode(value));
        }}
      />
    </ControlWithLabel>
  );
};
