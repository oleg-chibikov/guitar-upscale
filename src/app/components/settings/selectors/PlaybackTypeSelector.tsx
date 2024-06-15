"use client";
import { PlaybackType } from "@/app/data/playbackType";
import { selectSettings, setPlaybackType } from "@/app/store/settingsSlice";
import { Typography } from "@mui/material";
import React from "react";
import { useDispatch, useSelector } from "react-redux";
import { EnumSelector } from "./EnumSelector";

export const PlaybackTypeSelector: React.FC = () => {
  const { playbackType } = useSelector(selectSettings);
  const dispatch = useDispatch();

  return (
    <>
      <Typography variant="body2">Playback type:</Typography>
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
