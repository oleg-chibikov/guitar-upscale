import { DialogContentWrapper } from "@/app/components/layout/DialogContentWrapper";
import { Alert, Button, Dialog, DialogActions } from "@mui/material";
import React from "react";

interface ConfirmationDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  content: string;
  confirmButtonText?: string;
  cancelButtonText?: string;
}

export const ConfirmationDialog: React.FC<ConfirmationDialogProps> = ({
  open,
  onClose,
  onConfirm,
  title,
  content,
  confirmButtonText = "Confirm",
  cancelButtonText = "Cancel",
}) => {
  return (
    <Dialog open={open} onClose={onClose}>
      <DialogContentWrapper headerText={title}>
        <Alert severity="warning">{content}</Alert>
        <DialogActions>
          <Button onClick={onClose} color="primary">
            {cancelButtonText}
          </Button>
          <Button onClick={onConfirm} color="error" variant="contained">
            {confirmButtonText}
          </Button>
        </DialogActions>
      </DialogContentWrapper>
    </Dialog>
  );
};
