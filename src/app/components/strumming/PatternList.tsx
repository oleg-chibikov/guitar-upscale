import { Delete as DeleteIcon, Edit as EditIcon } from "@mui/icons-material";
import {
  IconButton as MuiIconButton,
  Tooltip,
  Typography,
} from "@mui/material";
import React from "react";
import { useSelector } from "react-redux";

import { Pattern } from "@/app/data/strummingData";
import { Theme } from "@/app/data/theme";
import { formatStrums } from "@/app/helpers/strummingHelper";
import { selectUi } from "@/app/store/uiSlice";

interface PatternListProps {
  patterns: Pattern[];
  onEdit: (pattern: Pattern) => void;
  onDelete: (id: string) => void;
}

export const PatternList: React.FC<PatternListProps> = React.memo(
  ({ patterns, onEdit, onDelete }) => {
    const { theme } = useSelector(selectUi);

    const bgColor =
      theme === Theme.Light
        ? "bg-accented_background-light"
        : "bg-accented_background-dark";

    const textColor =
      theme === Theme.Light ? "text-foreground-light" : "text-foreground-dark";

    const rowBgEven =
      theme === Theme.Light ? "bg-background-light" : "bg-background-dark";

    const rowBgOdd = theme === Theme.Light ? "bg-panel-light" : "bg-panel-dark";

    if (!patterns.length) {
      return (
        <Typography variant="overline">No custom patterns added yet</Typography>
      );
    }

    return (
      <div className={`max-h-60 overflow-auto ${bgColor} shadow-md`}>
        <table className="w-full">
          <thead>
            <tr>
              {["Pattern", "Time", "Edit", "Delete"].map((header, index) => (
                <th key={index} className={`font-semibold ${textColor}`}>
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {patterns.map((pattern, index) => (
              <tr
                key={pattern.id}
                className={`${index % 2 === 0 ? rowBgEven : rowBgOdd}`}
              >
                <td className={`${textColor} px-4 py-2`}>
                  <Typography textOverflow="clip" overflow="auto" noWrap>
                    {formatStrums(pattern.strums)}
                  </Typography>
                </td>
                <td className={`${textColor} px-4 py-2`}>
                  <Typography noWrap>{pattern.timeSignature}</Typography>
                </td>
                <td className={`px-4 py-2 text-center`}>
                  <Tooltip title="Edit pattern">
                    <MuiIconButton onClick={() => onEdit(pattern)}>
                      <EditIcon fontSize="small" />
                    </MuiIconButton>
                  </Tooltip>
                </td>
                <td className={`px-4 py-2 text-center`}>
                  <Tooltip title="Delete pattern">
                    <MuiIconButton
                      onClick={() => onDelete(pattern.id)}
                      className={`text-red-500 hover:text-red-700`} // Adjusted to make delete icon red
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
    );
  }
);
