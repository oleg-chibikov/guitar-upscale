import { CloseIcon } from "@/app/components/uiFramework/CloseIcon";
import { Theme } from "@/app/data/theme";
import { useUiSelector } from "@/app/hooks/storeHooks";
import { Box, DialogTitle, Typography } from "@mui/material";
import React from "react";
interface DialogHeaderProps {
  text: string;
  onClose?: () => void;
}

export const DialogHeader: React.FC<DialogHeaderProps> = ({
  text,
  onClose,
}) => {
  const theme = useUiSelector((s) => s.theme);

  return (
    <DialogTitle
      sx={{
        position: "relative",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
      }}
    >
      <Typography
        variant="h4"
        align="center"
        className={
          theme === Theme.Light
            ? "text-foreground-light"
            : "text-foreground-dark"
        }
        sx={{ flexGrow: 1 }}
      >
        {text}
      </Typography>
      {onClose && (
        <Box className="right-6 absolute top-1/2 translate-y-[-50%]">
          <CloseIcon onPress={onClose} />
        </Box>
      )}
    </DialogTitle>
  );
};
