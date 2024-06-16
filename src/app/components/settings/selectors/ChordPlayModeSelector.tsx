import { ControlWithLabel } from "@/app/components/layout/ControlWithLabel";
import { ChordPlayMode } from "@/app/data/chordPlayMode";
import { selectSettings, setChordPlayMode } from "@/app/store/settingsSlice";
import React from "react";
import { useDispatch, useSelector } from "react-redux";
import { EnumSelector } from "./EnumSelector";

export const ChordPlayModeSelector: React.FC = () => {
  const { chordPlayMode } = useSelector(selectSettings);
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
