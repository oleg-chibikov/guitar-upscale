import { TimeSignature } from "@/app/data/clockConstants";
import { usePianoRollSelector } from "@/app/hooks/storeHooks";
import { setPianoRollSnap } from "@/app/store/pianoRollSlice";
import React from "react";
import { useDispatch } from "react-redux";
import { EnumSelector } from "../../uiFramework/EnumSelector";

export const PianoRollSnapSelector: React.FC = () => {
  const pianoRollSnap = usePianoRollSelector((s) => s.pianoRollSnap);
  const dispatch = useDispatch();

  return (
    <EnumSelector
      enumObj={TimeSignature}
      className="h-7"
      tooltip="Grid: notes snap to this length"
      selectedValue={pianoRollSnap}
      onValueChange={(value) => {
        dispatch(setPianoRollSnap(value));
      }}
      customLabel={(_key, value) => value}
    />
  );
};
