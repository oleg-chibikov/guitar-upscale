import React from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  Skin,
  selectControlPanel,
  setSelectedSkin,
} from "../../store/controlPanelSlice";
import { EnumSelector } from "./EnumSelector";

export const SkinSelector: React.FC = () => {
  const { selectedSkin } = useSelector(selectControlPanel);
  const dispatch = useDispatch();

  return (
    <EnumSelector
      enumObj={Skin}
      selectedValue={selectedSkin}
      onValueChange={(value) => {
        dispatch(setSelectedSkin(value));
      }}
    />
  );
};
