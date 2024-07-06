import { PianoRoll } from "@/app/components/pianoRoll/PianoRoll";
import { PitchAxis } from "@/app/components/pianoRoll/PitchAxis";
import { DialogWrapper } from "@/app/components/uiFramework/DialogWrapper";
import { PIANO_ROLL_DIALOG } from "@/app/data/elementIds";
import { ChordOrNote } from "@/app/engine/eventsByTick";
import { pianoRollData } from "@/app/engine/pianoRoll/pianoRollState";
import { useUiSelector } from "@/app/hooks/storeHooks";
import { setPianoRollExpanded } from "@/app/store/uiSlice";
import React, { useEffect, useState } from "react";
import { useDispatch } from "react-redux";

export const PianoRollDialog: React.FC = () => {
  const [notes, setNotes] = useState<{ tick: number; events: ChordOrNote[] }[]>(
    []
  );
  const pianoRollExpanded = useUiSelector((s) => s.pianoRollExpanded);
  const dispatch = useDispatch();

  const handleCloseDialog = () => {
    dispatch(setPianoRollExpanded(false));
  };

  useEffect(() => {
    if (pianoRollExpanded) {
      setNotes(pianoRollData?.items ?? []);
    }
  }, [pianoRollExpanded]);

  return (
    <DialogWrapper
      anchor="top"
      isOpen={pianoRollExpanded}
      close={handleCloseDialog}
      id={PIANO_ROLL_DIALOG}
      headerText="Piano Roll"
      className="h-screen"
    >
      <div className="flex">
        <PitchAxis className="shrink-0" />
        <div className="bg-red-500 w-[calc(100%-theme(space.16))]">
          <PianoRoll notes={notes} />
        </div>
      </div>
    </DialogWrapper>
  );
};
