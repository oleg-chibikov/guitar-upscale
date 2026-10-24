import { ConfirmationDialog } from "@/app/components/uiFramework/ConfirmationDialog";
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
    // a throttled save still waiting would write the old settings back after the purge
    await persistor.flush();
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
        title="Reset the settings?"
        content="Every setting goes back to its default. You can't undo it."
        confirmButtonText="Reset"
      />
    </>
  );
};
