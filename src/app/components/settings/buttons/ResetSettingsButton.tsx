import { ConfirmationDialog } from "@/app/components/layout/ConfirmationDialog";
import { persistor } from "@/app/store/store";
import { Button } from "@mui/material";
import React, { useState } from "react";

export const ResetSettingsButton: React.FC = () => {
  const [open, setOpen] = useState(false);

  const handleClickOpen = () => {
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
  };

  const handleConfirmReset = async () => {
    await persistor.purge();
    window.location.reload();
  };

  return (
    <>
      <Button variant="contained" color="error" onClick={handleClickOpen}>
        Reset Settings
      </Button>
      <ConfirmationDialog
        open={open}
        onClose={handleClose}
        onConfirm={handleConfirmReset}
        title="Confirm reset"
        content="Are you sure you want to reset settings? This action cannot be undone."
      />
    </>
  );
};
