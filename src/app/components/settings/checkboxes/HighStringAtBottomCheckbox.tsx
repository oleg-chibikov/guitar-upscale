"use client";

import { useUiSelector } from "@/app/hooks/storeHooks";
import { setHighStringAtBottom } from "@/app/store/uiSlice";
import React from "react";
import { useDispatch } from "react-redux";
import { CheckBox } from "../../uiFramework/CheckBox";

export const HighStringAtBottomCheckbox: React.FC = () => {
  const highStringAtBottom = useUiSelector((s) => s.highStringAtBottom);
  const dispatch = useDispatch();

  return (
    <CheckBox
      label="Thin string at the bottom"
      value={highStringAtBottom}
      onValueChange={(value: boolean) => dispatch(setHighStringAtBottom(value))}
    />
  );
};
