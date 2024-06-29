import { DialogWrapper } from "@/app/components/layout/DialogWrapper";
import { STRUMMING_PATTERN_EDITOR_DIALOG } from "@/app/data/elementIds";
import {
  DEFAULT_TIME_SIGNATURE,
  Pattern,
  getDefaultSlotsForTimeSignature,
} from "@/app/data/strummingData";
import {
  addPattern,
  deletePattern,
  getCustomPatterns,
} from "@/app/engine/strummingPatternsStorage";
import {
  checkCustomStrummingPatternAfterDeletion,
  selectSettings,
  setStrummingPatternId,
  triggerCustomStrummingPatternChanged,
} from "@/app/store/settingsSlice";
import {
  selectUi,
  setStrummingPatternEditorExpanded,
} from "@/app/store/uiSlice";
import AddIcon from "@mui/icons-material/Add";
import { IconButton, Tooltip } from "@mui/material";
import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { PatternEditor } from "./PatternEditor";
import { PatternList } from "./PatternList";

export const StrummingPatternDialog: React.FC = () => {
  const [patterns, setPatterns] = useState<Pattern[]>([]);
  const [currentPattern, setCurrentPattern] = useState<Pattern | null>(null);
  const dispatch = useDispatch();
  const { strummingPatternEditorExpanded } = useSelector(selectUi);
  const { strummingPatternChangedTrigger } = useSelector(selectSettings);

  useEffect(() => {
    const customPatterns = getCustomPatterns();
    setPatterns(customPatterns);
  }, [strummingPatternChangedTrigger]);

  const handleSave = (pattern: Pattern) => {
    addPattern(pattern);
    setCurrentPattern(null);
    dispatch(setStrummingPatternId(pattern.id)); // select the new pattern automatically
    dispatch(triggerCustomStrummingPatternChanged()); // to refresh the patterns dropdown
  };

  const handleDelete = (id: number) => {
    deletePattern(id);
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
    dispatch(setStrummingPatternId(newId)); // select the new pattern automatically
    dispatch(triggerCustomStrummingPatternChanged()); // to refresh the patterns dropdown
  };

  const close = () => dispatch(setStrummingPatternEditorExpanded(false));

  return (
    <DialogWrapper
      isOpen={strummingPatternEditorExpanded}
      close={close}
      id={STRUMMING_PATTERN_EDITOR_DIALOG}
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
    </DialogWrapper>
  );
};
