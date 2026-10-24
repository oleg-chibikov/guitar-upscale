import { ConfirmationDialog } from "@/app/components/uiFramework/ConfirmationDialog";
import { IconButtonWrapper } from "@/app/components/uiFramework/IconButton";
import {
  CanSetLooperState,
  clearLooperState,
  looperState,
} from "@/app/engine/looper/looper";
import Clear from "@mui/icons-material/Clear";
import React, { useState } from "react";

export const ClearLooperButton: React.FC<CanSetLooperState> = ({
  setState,
  disabled,
}) => {
  const [open, setOpen] = useState(false);

  const handleClickOpen = () => {
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
  };

  const handleConfirmClear = () => {
    setOpen(false);
    clearLooperState();
    setState({ ...looperState });
    handleClose();
  };

  return (
    <>
      <IconButtonWrapper
        disabled={disabled}
        icon={<Clear />}
        activeBg="error"
        tooltip={"Clear looper"}
        isActive={true}
        onPress={handleClickOpen}
      />
      <ConfirmationDialog
        open={open}
        onClose={handleClose}
        onConfirm={handleConfirmClear}
        title="Clear the looper?"
        content="This removes every recorded loop. You can't undo it."
        confirmButtonText="Clear looper"
      />
    </>
  );
};
