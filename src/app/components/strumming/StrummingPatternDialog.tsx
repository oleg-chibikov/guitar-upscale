import { CloseIcon } from "@/app/components/CloseIcon";
import { DialogHeader } from "@/app/components/layout/DialogHeader";
import { STRUMMING_PATTERN_EDITOR } from "@/app/data/elementIds";
import {
  DEFAULT_TIME_SIGNATURE,
  Pattern,
  getSlotsForTimeSignature,
} from "@/app/data/strummingData";
import { triggerCustomStrummingPatternChanged } from "@/app/store/settingsSlice";
import AddIcon from "@mui/icons-material/Add";
import { Dialog, DialogContent, IconButton, Tooltip } from "@mui/material";
import React, { useEffect, useState } from "react";
import { useDispatch } from "react-redux";
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
  const dispatch = useDispatch();

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
    dispatch(triggerCustomStrummingPatternChanged()); // to refresh the patterns dropdown
  };

  const handleDelete = (id: number) => {
    const newPatterns = patterns.filter((p) => p.id !== id);
    setPatterns(newPatterns);
    localStorage.setItem("strummingPatterns", JSON.stringify(newPatterns));
    dispatch(triggerCustomStrummingPatternChanged()); // to refresh the patterns dropdown
  };

  const handleNewPattern = () => {
    setCurrentPattern({
      id: Date.now(),
      timeSignature: DEFAULT_TIME_SIGNATURE,
      strums: Array(getSlotsForTimeSignature(DEFAULT_TIME_SIGNATURE)).fill(""),
    });
  };

  return (
    <Dialog
      id={STRUMMING_PATTERN_EDITOR}
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      className=""
    >
      <CloseIcon onPress={onClose} />
      <DialogHeader text="Strumming pattern editor" />
      <DialogContent className="flex flex-col gap-2">
        {currentPattern ? (
          <PatternEditor
            pattern={currentPattern}
            onSave={handleSave}
            onCancel={() => setCurrentPattern(null)}
          />
        ) : (
          <>
            <div>
              <Tooltip title="Create New Pattern">
                <IconButton onClick={handleNewPattern}>
                  <AddIcon />
                </IconButton>
              </Tooltip>
            </div>
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
