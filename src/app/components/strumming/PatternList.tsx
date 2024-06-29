import { Delete as DeleteIcon, Edit as EditIcon } from "@mui/icons-material";
import {
  IconButton as MuiIconButton,
  Tooltip,
  Typography,
} from "@mui/material";
import React, { useState } from "react";
import { useSelector } from "react-redux";

import { ConfirmationDialog } from "@/app/components/layout/ConfirmationDialog";
import { Pattern } from "@/app/data/strummingData";
import { Theme } from "@/app/data/theme";
import { formatStrums } from "@/app/helpers/strummingHelper";
import { selectUi } from "@/app/store/uiSlice";

interface PatternListProps {
  patterns: Pattern[];
  onEdit: (pattern: Pattern) => void;
  onDelete: (id: number) => void;
}

export const PatternList: React.FC<PatternListProps> = React.memo(
  ({ patterns, onEdit, onDelete }) => {
    const { theme } = useSelector(selectUi);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [patternIdToDelete, setPatternIdToDelete] = useState<number | null>(
      null
    );

    const handleDeleteClick = (id: number) => {
      setPatternIdToDelete(id);
      setDeleteDialogOpen(true);
    };

    const handleConfirmDelete = () => {
      if (patternIdToDelete) {
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
          <table className="w-full relative">
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
                    <Typography textOverflow="clip" overflow="auto" noWrap>
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
          title="Confirm Delete"
          content="Are you sure you want to delete this pattern? This action cannot be undone."
        />
      </>
    );
  }
);
