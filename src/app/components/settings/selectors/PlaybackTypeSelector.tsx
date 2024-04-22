"use client";
import { PlaybackType } from "@/app/data/playbackType";
import React from "react";
import { useDispatch, useSelector } from "react-redux";
import { selectSettings, setPlaybackType } from "../../../store/settingsSlice";
import { EnumSelector } from "./EnumSelector";

export const PlaybackTypeSelector: React.FC = () => {
  const { playbackType } = useSelector(selectSettings);
  const dispatch = useDispatch();

  return (
    <>
      <span>Playback type:</span>
      <EnumSelector
        enumObj={PlaybackType}
        selectedValue={playbackType}
        onValueChange={(value) => {
          dispatch(setPlaybackType(value));
        }}
      />
    </>
  );
};
