import { Theme } from "@/app/data/theme";
import { selectUi } from "@/app/store/uiSlice";
import { DialogTitle, Typography } from "@mui/material";
import React from "react";
import { useSelector } from "react-redux";

interface DialogHeaderProps {
  text: string;
}

export const DialogHeader: React.FC<DialogHeaderProps> = ({ text }) => {
  const { theme } = useSelector(selectUi);

  return (
    <DialogTitle>
      <Typography
        variant="h4"
        align="center"
        className={
          theme === Theme.Light
            ? "text-foreground-light"
            : "text-foreground-dark"
        }
      >
        {text}
      </Typography>
    </DialogTitle>
  );
};
