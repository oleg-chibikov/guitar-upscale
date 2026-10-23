import { CloseIcon } from "@/app/components/uiFramework/CloseIcon";
import { Theme } from "@/app/data/theme";
import { useUiSelector } from "@/app/hooks/storeHooks";
import { Box, DialogTitle } from "@mui/material";
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
      variant="h4"
      align="center"
      sx={{
        position: "relative",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
      }}
      className={
        theme === Theme.Light ? "text-foreground-light" : "text-foreground-dark"
      }
    >
      {text}
      {onClose && (
        <Box className="absolute top-1/2 right-6 translate-y-[-50%]">
          <CloseIcon onPress={onClose} />
        </Box>
      )}
    </DialogTitle>
  );
};
