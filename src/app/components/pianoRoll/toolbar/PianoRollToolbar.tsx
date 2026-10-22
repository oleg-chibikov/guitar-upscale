import { IconButtonWrapper } from "@/app/components/uiFramework/IconButton";
import { usePianoRoll } from "@/app/context/PianoRollProvider";
import { isMac } from "@/app/components/pianoRoll/toolbar/shortcutText";
import { usePianoRollSelector } from "@/app/hooks/storeHooks";
import { setAxisLock, setCopyMode } from "@/app/store/pianoRollSlice";
import CompareArrows from "@mui/icons-material/CompareArrows";
import ContentCopy from "@mui/icons-material/ContentCopy";
import Redo from "@mui/icons-material/Redo";
import Undo from "@mui/icons-material/Undo";
import React from "react";
import { useDispatch } from "react-redux";

const mod = isMac() ? "⌘" : "Ctrl+";
const alt = isMac() ? "⌥" : "Alt";

const Divider = () => <div className="w-px h-6 bg-gray-600 mx-0.5" />;

export const PianoRollToolbar: React.FC = () => {
  const { undo, redo, canUndo, canRedo, undoLabel, redoLabel } =
    usePianoRoll();
  const copyMode = usePianoRollSelector((s) => s.copyMode);
  const axisLock = usePianoRollSelector((s) => s.axisLock);
  const dispatch = useDispatch();

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
      <Divider />
      <IconButtonWrapper
        icon={<ContentCopy />}
        tooltip={`Copy notes when dragging (or hold ${alt})`}
        onPress={() => dispatch(setCopyMode(!copyMode))}
        isActive={copyMode}
      />
      <IconButtonWrapper
        icon={<CompareArrows />}
        tooltip={`Drag notes in time or in pitch only (or hold ${mod.replace("+", "")})`}
        onPress={() => dispatch(setAxisLock(!axisLock))}
        isActive={axisLock}
      />
    </div>
  );
};
