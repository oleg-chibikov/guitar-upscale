"use client";
import ManageSearch from "@mui/icons-material/ManageSearch";
import React from "react";
import { NoPremiumButton } from "./NoPremiumButton";

export const DisabledDetectScaleButton: React.FC = (props) => {
  return (
    <NoPremiumButton
      {...props}
      planName="any"
      functionalityDescription="detect scales"
      icon={<ManageSearch />}
    />
  );
};
