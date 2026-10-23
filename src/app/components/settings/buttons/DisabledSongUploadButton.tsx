"use client";
import UploadFile from "@mui/icons-material/UploadFile";
import React from "react";
import { NoPremiumButton } from "./NoPremiumButton";

export const DisabledSongUploadButton: React.FC = (props) => {
  return (
    <NoPremiumButton
      {...props}
      planName="a Composer"
      functionalityDescription="add your own Guitar Pro and MIDI songs"
      icon={<UploadFile />}
    />
  );
};
