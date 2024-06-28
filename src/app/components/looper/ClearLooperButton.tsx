import { ConfirmationDialog } from "@/app/components/layout/ConfirmationDialog";
import { IconButtonWrapper } from "@/app/components/settings/buttons/IconButton";
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
    clearLooperState();
    setState({ ...looperState });
    handleClose();
  };

  return (
    <>
      <IconButtonWrapper
        disabled={disabled}
        icon={<Clear />}
        activeBg="bg-red-500"
        tooltip={"Clear looper"}
        isActive={true}
        onPress={handleClickOpen}
      />
      <ConfirmationDialog
        open={open}
        onClose={handleClose}
        onConfirm={handleConfirmClear}
        title="Confirm clear"
        content="Are you sure you want to clear the looper state? This action cannot be undone."
      />
    </>
  );
};
