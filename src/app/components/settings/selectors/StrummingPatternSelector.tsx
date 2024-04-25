import { chordStrummingPatterns } from "@/app/data/chordStrummingPatterns";
import {
  selectSettings,
  setChordCustomStrummingPattern,
} from "@/app/store/settingsSlice";
import React from "react";
import { useDispatch, useSelector } from "react-redux";
import { SelectWrapper } from "./SelectWrapper";

const StrummingPatternSelector: React.FC = () => {
  const { chordCustomStrummingPattern } = useSelector(selectSettings);
  const dispatch = useDispatch();

  return (
    <SelectWrapper
      value={chordCustomStrummingPattern}
      onChange={(value) => {
        dispatch(setChordCustomStrummingPattern(value as string));
      }}
      options={chordStrummingPatterns.map((pattern) => {
        return {
          value: pattern,
          label: pattern,
        };
      })}
    />
  );
};

export { StrummingPatternSelector };
