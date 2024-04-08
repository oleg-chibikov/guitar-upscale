import React from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  selectControlPanel,
  setMatchFullChord,
} from "../../store/controlPanelSlice";
import { CheckBox, Styleable } from "./CheckBox";

export const MatchFullChordCheckbox: React.FC<Styleable> = (props) => {
  const { matchFullChord } = useSelector(selectControlPanel);
  const dispatch = useDispatch();

  return (
    <CheckBox
      {...props}
      label="Selected scale should match all the notes of chord to play it"
      value={matchFullChord}
      onValueChange={(value: boolean) => dispatch(setMatchFullChord(value))}
    />
  );
};
