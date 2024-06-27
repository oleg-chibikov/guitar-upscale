import { STRUMMING_PATTERN_EDITOR } from "@/app/data/elementIds";
import {
  Pattern,
  STRUMMING_PLACEHOLDER,
  getTicksForTimeSignature,
} from "@/app/data/strummingData";
import { Button, Dialog, DialogContent, DialogTitle } from "@mui/material";
import React, { useEffect, useState } from "react";
import { PatternEditor } from "./PatternEditor";
import { PatternList } from "./PatternList";

interface StrummingPatternDialogProps {
  open: boolean;
  onClose: () => void;
}

export const StrummingPatternDialog: React.FC<StrummingPatternDialogProps> = ({
  open,
  onClose,
}) => {
  const [patterns, setPatterns] = useState<Pattern[]>([]);
  const [currentPattern, setCurrentPattern] = useState<Pattern | null>(null);

  useEffect(() => {
    const savedPatterns = localStorage.getItem("strummingPatterns");
    if (savedPatterns) {
      setPatterns(JSON.parse(savedPatterns));
    }
  }, []);

  const handleSave = (pattern: Pattern) => {
    const updatedPatterns = patterns.some((p) => p.id === pattern.id)
      ? patterns.map((p) => (p.id === pattern.id ? pattern : p))
      : [...patterns, pattern];
    setPatterns(updatedPatterns);
    localStorage.setItem("strummingPatterns", JSON.stringify(updatedPatterns));
    setCurrentPattern(null);
  };

  const handleDelete = (id: string) => {
    const newPatterns = patterns.filter((p) => p.id !== id);
    setPatterns(newPatterns);
    localStorage.setItem("strummingPatterns", JSON.stringify(newPatterns));
  };

  const handleNewPattern = () => {
    setCurrentPattern({
      id: Date.now().toString(),
      timeSignature: "1/1",
      strums: Array(getTicksForTimeSignature("1/1")).fill(
        STRUMMING_PLACEHOLDER
      ),
    });
  };

  return (
    <Dialog
      id={STRUMMING_PATTERN_EDITOR}
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
    >
      <DialogTitle>Strumming Pattern Editor</DialogTitle>
      <DialogContent>
        {currentPattern ? (
          <PatternEditor
            pattern={currentPattern}
            onSave={handleSave}
            onCancel={() => setCurrentPattern(null)}
          />
        ) : (
          <>
            <Button variant="contained" onClick={handleNewPattern}>
              New Pattern
            </Button>
            <PatternList
              patterns={patterns}
              onEdit={setCurrentPattern}
              onDelete={handleDelete}
            />
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};
