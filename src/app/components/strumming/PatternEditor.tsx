import { SelectWrapper } from "@/app/components/settings/selectors/SelectWrapper";
import { StrumGrid } from "@/app/components/strumming/StrumGrid";
import {
  Pattern,
  STRUMMING_PLACEHOLDER,
  StrumDirection,
  TimeSignature,
  getTicksForTimeSignature,
  timeSignatureOptions,
} from "@/app/data/strummingData";
import { Button } from "@mui/material";
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
    const newTimeSignature = value as TimeSignature;
    setCurrentPattern({
      ...currentPattern,
      timeSignature: newTimeSignature,
      strums: Array(getTicksForTimeSignature(newTimeSignature)).fill(
        STRUMMING_PLACEHOLDER
      ),
    });
  };

  const handleStrum = (index: number, newValue: StrumDirection) => {
    const newStrums = [...currentPattern.strums];
    newStrums[index] = newValue;
    setCurrentPattern({ ...currentPattern, strums: newStrums });
  };

  return (
    <>
      <SelectWrapper
        options={timeSignatureOptions}
        value={currentPattern.timeSignature}
        onChange={handleTimeSignatureChange}
      />
      <StrumGrid pattern={currentPattern} onStrum={handleStrum} />
      <div className="flex flex-row gap-2">
        <Button
          variant="contained"
          onClick={() => onSave(currentPattern)}
          className="mr-2"
        >
          Save
        </Button>
        <Button variant="outlined" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </>
  );
};
