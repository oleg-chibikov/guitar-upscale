import { StrumGrid } from "@/app/components/strumming/StrumGrid";
import { EnumSelector } from "@/app/components/uiFramework/EnumSelector";
import { TimeSignature } from "@/app/data/clockConstants";
import { StrumDirection, StrummingPattern } from "@/app/data/strummingPatterns";

import { Button, DialogActions, Typography } from "@mui/material";
import React, { useCallback, useState } from "react";

interface PatternEditorProps {
  pattern: StrummingPattern;
  onSave: (pattern: StrummingPattern) => void;
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
      <div className="flex flex-row justify-start items-center gap-2">
        <Typography>Each cell represents</Typography>
        <EnumSelector
          enumObj={TimeSignature}
          selectedValue={currentPattern.timeSignature}
          onValueChange={handleTimeSignatureChange}
          customLabel={(key, value) => value}
        />
        <Typography>of a bar</Typography>
      </div>
      <StrumGrid
        pattern={currentPattern}
        onStrum={handleStrum}
        onAdd={handleAddCells}
        onRemove={handleRemoveCells}
      />
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
