import { IconButton } from "@/app/components/settings/buttons/IconButton";
import {
  CanSetLooperState,
  clearLooperState,
  looperState,
} from "@/app/engine/looper/looper";
import Clear from "@mui/icons-material/Clear";
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
} from "@mui/material";
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
      <IconButton
        disabled={disabled}
        icon={<Clear />}
        activeBg="bg-red-500"
        tooltip={"Clear looper"}
        isActive={true}
        onPress={handleClickOpen}
      />
      <Dialog open={open} onClose={handleClose}>
        <DialogTitle>Confirm Clear</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to clear the looper state? This action cannot
            be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose} color="primary">
            Cancel
          </Button>
          <Button
            onClick={handleConfirmClear}
            color="error"
            variant="contained"
          >
            Confirm
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};
