"use client";
import { ControlWithLabel } from "@/app/components/uiFramework/ControlWithLabel";
import { Skin } from "@/app/data/skin";
import { selectUi, setSkin } from "@/app/store/uiSlice";
import React from "react";
import { useDispatch, useSelector } from "react-redux";
import { EnumSelector } from "../../uiFramework/EnumSelector";

export const SkinSelector: React.FC = () => {
  const { skin } = useSelector(selectUi);
  const dispatch = useDispatch();

  return (
    <ControlWithLabel label="Skin">
      <EnumSelector
        enumObj={Skin}
        selectedValue={skin}
        onValueChange={(value) => {
          dispatch(setSkin(value));
        }}
      />
    </ControlWithLabel>
  );
};
