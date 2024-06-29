import { DialogWrapper } from "@/app/components/layout/DialogWrapper";
import { CONFIRMATION_DIALOG } from "@/app/data/elementIds";
import { Alert, Button, DialogActions } from "@mui/material";
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
    <DialogWrapper
      isOpen={open}
      close={onClose}
      headerText={title}
      id={CONFIRMATION_DIALOG}
    >
      <Alert severity="warning">{content}</Alert>
      <DialogActions>
        <Button onClick={onClose} color="primary">
          {cancelButtonText}
        </Button>
        <Button onClick={onConfirm} color="error" variant="contained">
          {confirmButtonText}
        </Button>
      </DialogActions>
    </DialogWrapper>
  );
};
