import { usePremiumFeatures } from "@/app/context/PremiumFeaturesContext";
import React from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  Skin,
  selectControlPanel,
  setSkin,
} from "../../../store/controlPanelSlice";
import { EnumSelector } from "./EnumSelector";

export const SkinSelector: React.FC = () => {
  const { skin } = useSelector(selectControlPanel);
  const dispatch = useDispatch();
  const { skinSelection } = usePremiumFeatures();

  if (!skinSelection) {
    return null;
  }

  return (
    <EnumSelector
      enumObj={Skin}
      selectedValue={skin}
      onValueChange={(value) => {
        dispatch(setSkin(value));
      }}
    />
  );
};
