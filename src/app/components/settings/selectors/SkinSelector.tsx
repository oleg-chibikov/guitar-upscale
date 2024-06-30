"use client";
import { ControlWithLabel } from "@/app/components/uiFramework/ControlWithLabel";
import {
  CombinedSkinType,
  EightStringSkin,
  SevenStringSkin,
  Skin,
} from "@/app/data/skin";
import { selectSettings } from "@/app/store/settingsSlice"; // Assuming you have a settingsSlice to select stringCount
import { selectUi, setSkin } from "@/app/store/uiSlice";
import React from "react";
import { useDispatch, useSelector } from "react-redux";
import { EnumSelector } from "../../uiFramework/EnumSelector";

export const SkinSelector: React.FC = () => {
  const { skin } = useSelector(selectUi);
  const { stringCount } = useSelector(selectSettings);
  const dispatch = useDispatch();

  let enumObj: Record<string, CombinedSkinType>;
  if (stringCount === 7) {
    enumObj = SevenStringSkin;
  } else if (stringCount === 8) {
    enumObj = EightStringSkin;
  } else {
    enumObj = Skin;
  }

  return (
    <ControlWithLabel label="Skin">
      <EnumSelector
        enumObj={enumObj}
        selectedValue={skin}
        onValueChange={(value) => {
          dispatch(setSkin(value));
        }}
      />
    </ControlWithLabel>
  );
};
