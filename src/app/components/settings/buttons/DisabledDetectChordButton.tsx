"use client";
import Troubleshoot from "@mui/icons-material/Troubleshoot";
import React from "react";
import { NoPremiumButton } from "./NoPremiumButton";

export const DisabledDetectChordButton: React.FC = (props) => {
  return (
    <NoPremiumButton
      {...props}
      planName="any"
      functionalityDescription="detect chords"
      icon={<Troubleshoot />}
    />
  );
};
