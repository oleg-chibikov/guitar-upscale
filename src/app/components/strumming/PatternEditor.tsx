import { EnumSelector } from "@/app/components/settings/selectors/EnumSelector";
import { StrumGrid } from "@/app/components/strumming/StrumGrid";
import {
  Pattern,
  StrumDirection,
  TimeSignature,
} from "@/app/data/strummingData";
import AddIcon from "@mui/icons-material/Add";
import RemoveIcon from "@mui/icons-material/Remove";
import {
  Button,
  DialogActions,
  IconButton,
  Tooltip,
  Typography,
} from "@mui/material";
import React, { useCallback, useState } from "react";

interface PatternEditorProps {
  pattern: Pattern;
  onSave: (pattern: Pattern) => void;
  onCancel: () => void;
}

export const PatternEditor: React.FC<PatternEditorProps> = ({
  pattern,
  onSave,
  onCancel,
}) => {
  const [currentPattern, setCurrentPattern] = useState(pattern);

  const handleTimeSignatureChange = (value: string | number) => {
    const timeSignature = value as TimeSignature;
    setCurrentPattern((prevPattern) => ({
      ...prevPattern,
      timeSignature,
    }));
  };

  const handleStrum = useCallback((index: number, newValue: StrumDirection) => {
    setCurrentPattern((prevPattern) => {
      const newStrums = [...prevPattern.strums];
      newStrums[index] = newValue;
      return { ...prevPattern, strums: newStrums };
    });
  }, []);

  const handleAddCells = useCallback(() => {
    setCurrentPattern((prevPattern) => {
      const cellsToAdd = prevPattern.strums.length >= 4 ? 4 : 1;
      const newStrums = [...prevPattern.strums, ...Array(cellsToAdd).fill("")];
      return { ...prevPattern, strums: newStrums };
    });
  }, []);

  const handleRemoveCells = useCallback(() => {
    setCurrentPattern((prevPattern) => {
      if (prevPattern.strums.length <= 1) {
        return prevPattern;
      }
      const cellsToRemove = prevPattern.strums.length > 4 ? 4 : 1;
      const newStrums = prevPattern.strums.slice(0, -cellsToRemove);
      return { ...prevPattern, strums: newStrums };
    });
  }, []);

  return (
    <>
      <div className="flex flex-row gap-2 items-center">
        <Typography>Each cell represents</Typography>
        <EnumSelector
          enumObj={TimeSignature}
          selectedValue={currentPattern.timeSignature}
          onValueChange={handleTimeSignatureChange}
        />
      </div>

      <div className="mt-4 flex justify-start gap-2">
        <Tooltip title="Remove Cells">
          <IconButton
            disabled={pattern.strums.length <= 1}
            onClick={handleRemoveCells}
          >
            <RemoveIcon />
          </IconButton>
        </Tooltip>
        <Tooltip title="Add Cells">
          <IconButton onClick={handleAddCells}>
            <AddIcon />
          </IconButton>
        </Tooltip>
      </div>
      <StrumGrid pattern={currentPattern} onStrum={handleStrum} />
      <DialogActions>
        <Button color="primary" onClick={onCancel}>
          Cancel
        </Button>
        <Button variant="contained" onClick={() => onSave(currentPattern)}>
          Save
        </Button>
      </DialogActions>
    </>
  );
};
