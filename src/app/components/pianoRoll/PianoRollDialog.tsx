import { PianoRoll } from "@/app/components/pianoRoll/PianoRoll";
import { DialogWrapper } from "@/app/components/uiFramework/DialogWrapper";
import { PIANO_ROLL_DIALOG } from "@/app/data/elementIds";
import { Note, OctaveNote } from "@/app/data/notes";
import { getScalePattern } from "@/app/data/scales";
import { ChordOrNote } from "@/app/engine/eventsByTick";
import { pianoRollData } from "@/app/engine/pianoRoll/pianoRollState";
import { useSettingsSelector, useUiSelector } from "@/app/hooks/storeHooks";
import { setPianoRollExpanded } from "@/app/store/uiSlice";
import React, { useEffect, useState } from "react";
import { useDispatch } from "react-redux";

export const PianoRollDialog: React.FC = () => {
  const [notes, setNotes] = useState<{ tick: number; events: ChordOrNote[] }[]>(
    []
  );
  const scale = useSettingsSelector((s) => s.scale);
  const scaleGroup = useSettingsSelector((s) => s.scaleGroup);
  const [scalePattern, setScalePattern] = useState<Set<Note>>(new Set<Note>());

  useEffect(() => {
    const pattern = getScalePattern(scaleGroup, scale, true);
    setScalePattern(pattern);
  }, [scale, scaleGroup]);

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
      <div className="bg-red-500 h-full w-full">
        <PianoRoll
          scalePattern={scalePattern}
          notes={notes}
          onNoteMove={(
            noteId: string,
            newTick: number,
            newPitch: OctaveNote
          ) => {
            pianoRollData?.changeEvent(noteId, newPitch, newTick);
            setNotes(pianoRollData?.items ?? []);
          }}
        />
      </div>
    </DialogWrapper>
  );
};
