import { ChordModeDialog } from "@/app/components/pianoRoll/ChordModeDialog";
import { PianoRoll } from "@/app/components/pianoRoll/PianoRoll";
import { PianoRollToolbar } from "@/app/components/pianoRoll/toolbar/PianoRollToolbar";
import { DialogWrapper } from "@/app/components/uiFramework/DialogWrapper";
import { BaseNoteProvider } from "@/app/context/BaseNoteProvider";
import { PianoRollProvider } from "@/app/context/PianoRollProvider";
import { PianoRollViewProvider } from "@/app/context/PianoRollViewProvider";
import { ScaleProvider } from "@/app/context/ScaleProvider";
import { PIANO_ROLL_DIALOG } from "@/app/data/elementIds";
import { useUiSelector } from "@/app/hooks/storeHooks";
import { setPianoRollExpanded } from "@/app/store/uiSlice";
import React from "react";
import { useDispatch } from "react-redux";

const PianoRollContent: React.FC = () => {
  return (
    <div className="flex h-full w-full flex-col">
      <PianoRollToolbar />
      <div className="min-h-0 flex-1">
        <PianoRoll />
      </div>
      <ChordModeDialog />
    </div>
  );
};

export const PianoRollDialog: React.FC = () => {
  const pianoRollExpanded = useUiSelector((s) => s.pianoRollExpanded);
  const dispatch = useDispatch();

  const handleCloseDialog = () => {
    dispatch(setPianoRollExpanded(false));
  };

  return (
    <DialogWrapper
      anchor="top"
      isOpen={pianoRollExpanded}
      close={handleCloseDialog}
      id={PIANO_ROLL_DIALOG}
      headerText="Piano Roll"
      className="h-screen pb-10"
      noPadding
    >
      <ScaleProvider>
        <BaseNoteProvider>
          <PianoRollProvider>
            <PianoRollViewProvider>
              <PianoRollContent />
            </PianoRollViewProvider>
          </PianoRollProvider>
        </BaseNoteProvider>
      </ScaleProvider>
    </DialogWrapper>
  );
};
