"use client";
import { setChordDetectorAvailable } from "@/app/store/settingsSlice";
import Troubleshoot from "@mui/icons-material/Troubleshoot";
import React, { useEffect } from "react";
import { useDispatch } from "react-redux";
import { NoPremiumButton } from "./NoPremiumButton";

export const DisabledDetectChordButton: React.FC = (props) => {
  const dispatch = useDispatch();

  // let the other components know the chords detector is not available
  useEffect(() => {
    dispatch(setChordDetectorAvailable(false));
  }, [dispatch]);

  return (
    <NoPremiumButton
      {...props}
      planName="any"
      functionalityDescription="detect chords"
      icon={<Troubleshoot />}
    />
  );
};
