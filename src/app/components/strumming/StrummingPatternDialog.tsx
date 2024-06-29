import { DialogContentWrapper } from "@/app/components/layout/DialogContentWrapper";
import { STRUMMING_PATTERN_EDITOR } from "@/app/data/elementIds";
import {
  DEFAULT_TIME_SIGNATURE,
  Pattern,
  getDefaultSlotsForTimeSignature,
} from "@/app/data/strummingData";
import {
  checkCustomStrummingPatternAfterDeletion,
  setChordCustomStrummingPatternId,
  triggerCustomStrummingPatternChanged,
} from "@/app/store/settingsSlice";
import AddIcon from "@mui/icons-material/Add";
import { Dialog, IconButton, Tooltip } from "@mui/material";
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
    dispatch(setChordCustomStrummingPatternId(pattern.id)); // select the new pattern automatically
    dispatch(triggerCustomStrummingPatternChanged()); // to refresh the patterns dropdown
  };

  const handleDelete = (id: number) => {
    const newPatterns = patterns.filter((p) => p.id !== id);
    setPatterns(newPatterns);
    localStorage.setItem("strummingPatterns", JSON.stringify(newPatterns));
    dispatch(checkCustomStrummingPatternAfterDeletion()); // if the current pattern was deleted - set a default one
    dispatch(triggerCustomStrummingPatternChanged()); // to refresh the patterns dropdown
  };

  const handleNewPattern = () => {
    const newId = Date.now();
    setCurrentPattern({
      id: newId,
      timeSignature: DEFAULT_TIME_SIGNATURE,
      strums: Array(
        getDefaultSlotsForTimeSignature(DEFAULT_TIME_SIGNATURE)
      ).fill(""),
    });
    dispatch(setChordCustomStrummingPatternId(newId)); // select the new pattern automatically
    dispatch(triggerCustomStrummingPatternChanged()); // to refresh the patterns dropdown
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md">
      <DialogContentWrapper
        id={STRUMMING_PATTERN_EDITOR}
        onClose={onClose}
        headerText="Strumming pattern editor"
      >
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
      </DialogContentWrapper>
    </Dialog>
  );
};
