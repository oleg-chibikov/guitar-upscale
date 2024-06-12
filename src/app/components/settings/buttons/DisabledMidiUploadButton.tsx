"use client";
import UploadFile from "@mui/icons-material/UploadFile";
import React from "react";
import { NoPremiumButton } from "./NoPremiumButton";

export const DisabledMidiUploadButton: React.FC = (props) => {
  return (
    <NoPremiumButton
      {...props}
      planName="composer"
      functionalityDescription="upload and play MIDI"
      icon={<UploadFile />}
    />
  );
};
