import { usePremiumFeatures } from "@/app/context/PremiumFeaturesContext";
import React from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  selectControlPanel,
  setUseAdvancedChords,
} from "../../../store/controlPanelSlice";
import { CheckBox } from "./CheckBox";

export const UseAdvancedChordsCheckbox: React.FC = (props) => {
  const { useAdvancedChords } = useSelector(selectControlPanel);
  const { advancedChords } = usePremiumFeatures();
  const dispatch = useDispatch();

  if (!advancedChords) {
    return null;
  }

  return (
    <CheckBox
      {...props}
      label="Show advanced chords"
      value={useAdvancedChords}
      onValueChange={(value: boolean) => dispatch(setUseAdvancedChords(value))}
    />
  );
};
