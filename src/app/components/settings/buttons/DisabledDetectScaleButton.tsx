"use client";
import { setScaleDetectorAvailable } from "@/app/store/settingsSlice";
import ManageSearch from "@mui/icons-material/ManageSearch";
import React, { useEffect } from "react";
import { useDispatch } from "react-redux";
import { NoPremiumButton } from "./NoPremiumButton";

export const DisabledDetectScaleButton: React.FC = (props) => {
  const dispatch = useDispatch();

  // let the other components know the chords detector is not available
  useEffect(() => {
    dispatch(setScaleDetectorAvailable(false));
  }, [dispatch]);

  return (
    <NoPremiumButton
      {...props}
      planName="any"
      functionalityDescription="detect scales"
      icon={<ManageSearch />}
    />
  );
};
