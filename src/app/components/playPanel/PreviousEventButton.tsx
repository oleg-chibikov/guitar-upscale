"use client";
import { UsePlayParams } from "@/app/hooks/usePlay";
import { selectSettings, setIsPreviousEventd } from "@/app/store/settingsSlice";
import ChevronLeft from "@mui/icons-material/ChevronLeft";
import PlayArrow from "@mui/icons-material/PlayArrow";
import React from "react";
import { useDispatch, useSelector } from "react-redux";
import { IconButton } from "../settings/buttons/IconButton";

type PlayButtonProps = UsePlayParams;

export const PreviousEventButton: React.FC<PlayButtonProps> = (params) => {
  const { isPaused } = useSelector(selectSettings);
  const dispatch = useDispatch();
  if (!isPaused) {
    return null;
  }
  return (
    <IconButton
      disabled={!isPaused}
      isActive={true}
      tooltip={"Previous event"}
      icon={<ChevronLeft />}
      onPress={() => {
        dispatch(setIsPreviousEvent(!isPreviousEventd));
      }}
    />
  );
};
