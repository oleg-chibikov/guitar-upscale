import { ChordsDisplayMode } from "@/app/data/chordsDisplayMode";
import { selectUi, setChordsDisplayMode } from "@/app/store/uiSlice";
import React from "react";
import { useDispatch, useSelector } from "react-redux";
import { EnumSelector } from "./EnumSelector";

export const ChordsDisplayModeSelector: React.FC = () => {
  const { chordsDisplayMode } = useSelector(selectUi);
  const dispatch = useDispatch();

  return (
    <>
      <span>Chords display mode:</span>
      <EnumSelector
        enumObj={ChordsDisplayMode}
        selectedValue={chordsDisplayMode}
        onValueChange={(value) => {
          dispatch(setChordsDisplayMode(value));
        }}
      />
    </>
  );
};
