"use client";
import { Skin } from "@/app/data/skin";
import { selectUi, setSkin } from "@/app/store/uiSlice";
import React from "react";
import { useDispatch, useSelector } from "react-redux";
import { EnumSelector } from "./EnumSelector";

export const SkinSelector: React.FC = () => {
  const { skin } = useSelector(selectUi);
  const dispatch = useDispatch();

  return (
    <>
      <span>Skin:</span>
      <EnumSelector
        enumObj={Skin}
        selectedValue={skin}
        onValueChange={(value) => {
          dispatch(setSkin(value));
        }}
      />
    </>
  );
};
