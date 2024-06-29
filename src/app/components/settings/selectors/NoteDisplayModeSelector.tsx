import { ControlWithLabel } from "@/app/components/uiFramework/ControlWithLabel";
import { NoteDisplayMode } from "@/app/data/noteDisplayMode";
import { selectUi, setNoteDisplayMode } from "@/app/store/uiSlice";
import React from "react";
import { useDispatch, useSelector } from "react-redux";
import { EnumSelector } from "../../uiFramework/EnumSelector";

export const NoteDisplayModeSelector: React.FC = () => {
  const { noteDisplayMode } = useSelector(selectUi);
  const dispatch = useDispatch();

  return (
    <ControlWithLabel label="Note display mode">
      <EnumSelector
        enumObj={NoteDisplayMode}
        selectedValue={noteDisplayMode}
        onValueChange={(value) => {
          dispatch(setNoteDisplayMode(value));
        }}
      />
    </ControlWithLabel>
  );
};
