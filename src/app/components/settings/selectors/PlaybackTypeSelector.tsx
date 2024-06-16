"use client";
import { ControlWithLabel } from "@/app/components/layout/ControlWithLabel";
import { PlaybackType } from "@/app/data/playbackType";
import { selectSettings, setPlaybackType } from "@/app/store/settingsSlice";
import React from "react";
import { useDispatch, useSelector } from "react-redux";
import { EnumSelector } from "./EnumSelector";

export const PlaybackTypeSelector: React.FC = () => {
  const { playbackType } = useSelector(selectSettings);
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
