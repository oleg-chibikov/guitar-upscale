"use client";
import { ControlWithLabel } from "@/app/components/uiFramework/ControlWithLabel";
import {
  CombinedSkinType,
  EightStringSkin,
  SevenStringSkin,
  Skin,
} from "@/app/data/skin";
import { useSettingsSelector, useUiSelector } from "@/app/hooks/storeHooks";
import { useOnlineStatus } from "@/app/hooks/useOnlineStatus";
import { setSkin } from "@/app/store/uiSlice";
import React from "react";
import { useDispatch } from "react-redux";
import { EnumSelector } from "../../uiFramework/EnumSelector";

export const SkinSelector: React.FC = () => {
  const isOnline = useOnlineStatus();
  const tooltip = isOnline
    ? undefined
    : "Skin selection is disabled while offline (it might need to download new image)";
  const skin = useUiSelector((s) => s.skin);
  const stringCount = useSettingsSelector((s) => s.stringCount);
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
        disabled={!isOnline}
        tooltip={tooltip}
      />
    </ControlWithLabel>
  );
};
