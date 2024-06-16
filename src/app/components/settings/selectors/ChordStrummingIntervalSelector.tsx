import { ControlWithLabel } from "@/app/components/layout/ControlWithLabel";
import { ChordStrummingInterval } from "@/app/data/chordStrummingInterval";
import {
  selectSettings,
  setChordStrummingInterval,
} from "@/app/store/settingsSlice";
import React from "react";
import { useDispatch, useSelector } from "react-redux";
import { EnumSelector } from "./EnumSelector";

export const ChordStrummingIntervalSelector: React.FC = () => {
  const { chordStrummingInterval } = useSelector(selectSettings);
  const dispatch = useDispatch();

  return (
    <ControlWithLabel label="Chord strumming interval">
      <EnumSelector
        enumObj={ChordStrummingInterval}
        selectedValue={chordStrummingInterval}
        onValueChange={(value) => {
          dispatch(setChordStrummingInterval(value));
        }}
      />
    </ControlWithLabel>
  );
};
