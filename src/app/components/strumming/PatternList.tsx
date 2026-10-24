import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import {
  IconButton as MuiIconButton,
  Tooltip,
  Typography,
} from "@mui/material";
import React, { useState } from "react";

import { ConfirmationDialog } from "@/app/components/uiFramework/ConfirmationDialog";
import { StrummingPattern, formatStrums } from "@/app/data/strummingPatterns";
import { Theme } from "@/app/data/theme";
import { useUiSelector } from "@/app/hooks/storeHooks";

interface PatternListProps {
  patterns: StrummingPattern[];
  onEdit: (pattern: StrummingPattern) => void;
  onDelete: (id: number) => void;
}

export const PatternList: React.FC<PatternListProps> = React.memo(
  ({ patterns, onEdit, onDelete }) => {
    const theme = useUiSelector((s) => s.theme);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [patternIdToDelete, setPatternIdToDelete] = useState<number | null>(
      null,
    );

    const handleDeleteClick = (id: number) => {
      setPatternIdToDelete(id);
      setDeleteDialogOpen(true);
    };

    const handleConfirmDelete = () => {
      if (patternIdToDelete !== null) {
        onDelete(patternIdToDelete);
      }
      setDeleteDialogOpen(false);
      setPatternIdToDelete(null);
    };

    const handleCancelDelete = () => {
      setDeleteDialogOpen(false);
      setPatternIdToDelete(null);
    };

    if (!patterns.length) {
      return (
        <Typography variant="overline">No custom patterns added yet</Typography>
      );
    }

    return (
      <>
        <div
          className={`max-h-60 overflow-auto ${
            theme === Theme.Light
              ? "bg-accented_background-light"
              : "bg-accented_background-dark"
          } shadow-md`}
        >
          <table className="relative w-full">
            <thead className="sticky top-0 z-10">
              <tr
                className={
                  theme === Theme.Light
                    ? "bg-accented_background-light"
                    : "bg-accented_background-dark"
                }
              >
                {["Pattern", "Time", "Edit", "Delete"].map((header, index) => (
                  <th
                    key={index}
                    className={`px-4 py-2 ${
                      index === 0 ? "text-start" : "text-center"
                    }`}
                  >
                    <Typography variant="overline" noWrap>
                      {header}
                    </Typography>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {patterns.map((pattern, index) => (
                <tr
                  key={pattern.id}
                  className={`${
                    index % 2 === 0
                      ? theme === Theme.Light
                        ? "bg-background-light"
                        : "bg-background-dark"
                      : theme === Theme.Light
                        ? "bg-panel-light"
                        : "bg-panel-dark"
                  }`}
                >
                  <td className={`px-4 py-1`}>
                    <Typography
                      noWrap
                      sx={{
                        textOverflow: "clip",
                        overflow: "auto",
                      }}
                    >
                      {formatStrums(pattern.strums)}
                    </Typography>
                  </td>
                  <td className={`px-4 py-1 text-center`}>
                    <Typography noWrap>{pattern.timeSignature}</Typography>
                  </td>
                  <td className={`px-4 py-1 text-center`}>
                    <Tooltip title="Edit pattern">
                      <MuiIconButton onClick={() => onEdit(pattern)}>
                        <EditIcon fontSize="small" />
                      </MuiIconButton>
                    </Tooltip>
                  </td>
                  <td className={`px-4 py-1 text-center`}>
                    <Tooltip title="Delete pattern">
                      <MuiIconButton
                        onClick={() => handleDeleteClick(pattern.id)}
                        className={`text-red-500 hover:text-red-700`}
                      >
                        <DeleteIcon fontSize="small" />
                      </MuiIconButton>
                    </Tooltip>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <ConfirmationDialog
          open={deleteDialogOpen}
          onClose={handleCancelDelete}
          onConfirm={handleConfirmDelete}
          title="Delete the pattern?"
          content="This removes the strumming pattern. You can't undo it."
          confirmButtonText="Delete"
        />
      </>
    );
  },
);

PatternList.displayName = "PatternList";
