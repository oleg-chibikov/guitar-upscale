import { PianoRoll } from "@/app/components/pianoRoll/PianoRoll";
import { DialogWrapper } from "@/app/components/uiFramework/DialogWrapper";
import { PianoRollProvider } from "@/app/context/PianoRollProvider";
import { ScaleProvider } from "@/app/context/ScaleProvider";
import { PIANO_ROLL_DIALOG } from "@/app/data/elementIds";
import { useUiSelector } from "@/app/hooks/storeHooks";
import { setPianoRollExpanded } from "@/app/store/uiSlice";
import React from "react";
import { useDispatch } from "react-redux";

const PianoRollContent: React.FC = () => {
  return (
    <div className="h-full w-full">
      <PianoRoll />
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
      className="h-screen"
    >
      <ScaleProvider>
        <PianoRollProvider>
          <PianoRollContent />
        </PianoRollProvider>
      </ScaleProvider>
    </DialogWrapper>
  );
};
