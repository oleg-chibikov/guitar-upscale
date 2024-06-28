import { DialogTitle, Typography } from "@mui/material";
import React from "react";

interface DialogHeaderProps {
  text: string;
}

export const DialogHeader: React.FC<DialogHeaderProps> = ({ text }) => {
  return (
    <DialogTitle>
      <Typography variant="h2" align="center">
        {text}
      </Typography>
    </DialogTitle>
  );
};
