"use client";
import { ControlWithLabel } from "@/app/components/uiFramework/ControlWithLabel";
import { PlaybackType } from "@/app/data/playbackType";
import { useSettingsSelector } from "@/app/hooks/storeHooks";
import { setPlaybackType } from "@/app/store/settingsSlice";
import React from "react";
import { useDispatch } from "react-redux";
import { EnumSelector } from "../../uiFramework/EnumSelector";

export const PlaybackTypeSelector: React.FC = () => {
  const playbackType = useSettingsSelector((s) => s.playbackType);
  const dispatch = useDispatch();

  return (
    <ControlWithLabel label="Playback type">
      <EnumSelector
        enumObj={PlaybackType}
        selectedValue={playbackType}
        onValueChange={(value) => {
          dispatch(setPlaybackType(value));
        }}
      />
    </ControlWithLabel>
  );
};
