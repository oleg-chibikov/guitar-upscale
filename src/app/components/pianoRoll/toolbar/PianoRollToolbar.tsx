import { IconButtonWrapper } from "@/app/components/uiFramework/IconButton";
import { usePianoRoll } from "@/app/context/PianoRollProvider";
import { isMac } from "@/app/components/pianoRoll/toolbar/shortcutText";
import Redo from "@mui/icons-material/Redo";
import Undo from "@mui/icons-material/Undo";
import React from "react";

const mod = isMac() ? "⌘" : "Ctrl+";

export const PianoRollToolbar: React.FC = () => {
  const { undo, redo, canUndo, canRedo, undoLabel, redoLabel } =
    usePianoRoll();

  return (
    <div className="flex flex-row flex-wrap items-center gap-1 px-1 py-0.5 bg-gray-800 border-b border-gray-700">
      <IconButtonWrapper
        icon={<Undo />}
        tooltip={`Undo${undoLabel !== undefined ? ` ${undoLabel.toLowerCase()}` : ""} (${mod}Z)`}
        onPress={undo}
        disabled={!canUndo}
      />
      <IconButtonWrapper
        icon={<Redo />}
        tooltip={`Redo${redoLabel !== undefined ? ` ${redoLabel.toLowerCase()}` : ""} (${mod}Shift+Z)`}
        onPress={redo}
        disabled={!canRedo}
      />
    </div>
  );
};
