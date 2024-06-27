import { StrummingPatternDialog } from "@/app/components/strumming/StrummingPatternDialog";
import { Button } from "@mui/material";
import React, { useState } from "react";

export const StrummingPatternEditor: React.FC = () => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const handleOpenDialog = () => setIsDialogOpen(true);
  const handleCloseDialog = () => setIsDialogOpen(false);

  return (
    <>
      <Button variant="contained" onClick={handleOpenDialog}>
        Open Strumming Pattern Editor
      </Button>

      <StrummingPatternDialog open={isDialogOpen} onClose={handleCloseDialog} />
    </>
  );
};
