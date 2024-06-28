import { EnumSelector } from "@/app/components/settings/selectors/EnumSelector";
import { StrumGrid } from "@/app/components/strumming/StrumGrid";
import {
  Pattern,
  StrumDirection,
  TimeSignature,
  getDefaultSlotsForTimeSignature,
} from "@/app/data/strummingData";
import { Button, DialogActions, Typography } from "@mui/material";
import React, { useState } from "react";

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
    setCurrentPattern({
      ...currentPattern,
      timeSignature,
      strums: Array(getDefaultSlotsForTimeSignature(timeSignature)).fill(""),
    });
  };

  const handleStrum = (index: number, newValue: StrumDirection) => {
    const newStrums = [...currentPattern.strums];
    newStrums[index] = newValue;
    setCurrentPattern({ ...currentPattern, strums: newStrums });
  };

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
