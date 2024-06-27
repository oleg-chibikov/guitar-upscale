import { Pattern } from "@/app/data/strummingData";
import { formatStrums } from "@/app/helpers/strummingHelper";
import { Delete as DeleteIcon, Edit as EditIcon } from "@mui/icons-material";
import { IconButton, Typography } from "@mui/material";
import React from "react";

interface PatternListProps {
  patterns: Pattern[];
  onEdit: (pattern: Pattern) => void;
  onDelete: (id: string) => void;
}

export const PatternList: React.FC<PatternListProps> = React.memo(
  ({ patterns, onEdit, onDelete }) => {
    return (
      <div className="max-h-40 overflow-auto">
        <Typography variant="h6" noWrap>
          Saved patterns
        </Typography>
        <div className="grid grid-cols-[3fr,1fr,auto,auto] gap-2 items-center">
          <div className="font-bold">Pattern</div>
          <div className="font-bold">Time</div>
          <div className="font-bold">Edit</div>
          <div className="font-bold">Delete</div>
          {patterns.map((pattern) => (
            <React.Fragment key={pattern.id}>
              <Typography
                textOverflow="clip"
                overflow="auto"
                noWrap
                variant="body2"
              >
                {formatStrums(pattern.strums)}
              </Typography>
              <Typography noWrap variant="body2">
                {pattern.timeSignature}
              </Typography>
              <IconButton onClick={() => onEdit(pattern)}>
                <EditIcon />
              </IconButton>
              <IconButton onClick={() => onDelete(pattern.id)}>
                <DeleteIcon />
              </IconButton>
            </React.Fragment>
          ))}
        </div>
      </div>
    );
  }
);
