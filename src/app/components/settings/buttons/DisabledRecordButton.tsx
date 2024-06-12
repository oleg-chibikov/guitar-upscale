"use client";
import FiberManualRecord from "@mui/icons-material/FiberManualRecord";
import React from "react";
import { NoPremiumButton } from "./NoPremiumButton";

export const DisabledDetectChordButton: React.FC = (props) => {
  return (
    <NoPremiumButton
      {...props}
      planName="a Composer"
      functionalityDescription="record MIDI"
      icon={<FiberManualRecord />}
    />
  );
};
