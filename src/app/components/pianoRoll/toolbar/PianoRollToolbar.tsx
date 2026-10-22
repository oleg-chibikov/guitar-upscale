import { PianoRollSnapSelector } from "@/app/components/pianoRoll/toolbar/PianoRollSnapSelector";
import { altKey, modKey } from "@/app/components/pianoRoll/toolbar/shortcutText";
import { usePianoRollActions } from "@/app/components/pianoRoll/usePianoRollActions";
import { IconButtonWrapper } from "@/app/components/uiFramework/IconButton";
import { usePianoRoll } from "@/app/context/PianoRollProvider";
import { usePianoRollSelector } from "@/app/hooks/storeHooks";
import {
  PianoRollTool,
  setAxisLock,
  setCopyMode,
  setPianoRollTool,
  setSnapToScale,
} from "@/app/store/pianoRollSlice";
import CleaningServices from "@mui/icons-material/CleaningServices";
import CompareArrows from "@mui/icons-material/CompareArrows";
import ContentCopy from "@mui/icons-material/ContentCopy";
import ContentCut from "@mui/icons-material/ContentCut";
import ContentPaste from "@mui/icons-material/ContentPaste";
import ControlPointDuplicate from "@mui/icons-material/ControlPointDuplicate";
import Delete from "@mui/icons-material/Delete";
import Edit from "@mui/icons-material/Edit";
import LibraryMusic from "@mui/icons-material/LibraryMusic";
import NearMe from "@mui/icons-material/NearMe";
import Redo from "@mui/icons-material/Redo";
import Undo from "@mui/icons-material/Undo";
import React, { ReactNode } from "react";
import { useDispatch } from "react-redux";

const Divider = () => <div className="w-px h-6 bg-gray-600 mx-0.5" />;

const Group: React.FC<{ children: ReactNode }> = ({ children }) => (
  <div className="flex flex-row items-center">{children}</div>
);

const tools: { tool: PianoRollTool; icon: ReactNode; tooltip: string }[] = [
  {
    tool: PianoRollTool.Select,
    icon: <NearMe />,
    tooltip: "Select and move (1). Drag on empty space to select an area",
  },
  {
    tool: PianoRollTool.Draw,
    icon: <Edit />,
    tooltip: "Draw notes (2). Drag right to make a note longer",
  },
  {
    tool: PianoRollTool.Erase,
    icon: <CleaningServices />,
    tooltip: "Erase notes (3). Drag across notes to erase them all",
  },
];

export const PianoRollToolbar: React.FC = () => {
  const { undo, redo, canUndo, canRedo, undoLabel, redoLabel } =
    usePianoRoll();
  const actions = usePianoRollActions();
  const tool = usePianoRollSelector((s) => s.tool);
  const snapToScale = usePianoRollSelector((s) => s.snapToScale);
  const copyMode = usePianoRollSelector((s) => s.copyMode);
  const axisLock = usePianoRollSelector((s) => s.axisLock);
  const dispatch = useDispatch();
  const mod = modKey();

  return (
    <div className="flex flex-row flex-wrap items-center gap-1 px-1 py-0.5 bg-gray-800 border-b border-gray-700">
      <Group>
        <IconButtonWrapper
          icon={<Undo />}
          tooltip={`Undo${undoLabel !== undefined ? ` ${undoLabel.toLowerCase()}` : ""} (${mod}+Z)`}
          onPress={undo}
          disabled={!canUndo}
        />
        <IconButtonWrapper
          icon={<Redo />}
          tooltip={`Redo${redoLabel !== undefined ? ` ${redoLabel.toLowerCase()}` : ""} (${mod}+Shift+Z)`}
          onPress={redo}
          disabled={!canRedo}
        />
      </Group>
      <Divider />
      <Group>
        {tools.map(({ tool: value, icon, tooltip }) => (
          <IconButtonWrapper
            key={value}
            icon={icon}
            tooltip={tooltip}
            onPress={() => dispatch(setPianoRollTool(value))}
            isActive={tool === value}
          />
        ))}
      </Group>
      <Divider />
      <Group>
        <PianoRollSnapSelector />
        <IconButtonWrapper
          icon={<LibraryMusic />}
          tooltip="Keep notes in the scale when moving and drawing"
          onPress={() => dispatch(setSnapToScale(!snapToScale))}
          isActive={snapToScale}
        />
      </Group>
      <Divider />
      <Group>
        <IconButtonWrapper
          icon={<ContentCopy />}
          tooltip={`Drag copies notes (or hold ${altKey()})`}
          onPress={() => dispatch(setCopyMode(!copyMode))}
          isActive={copyMode}
        />
        <IconButtonWrapper
          icon={<CompareArrows />}
          tooltip={`Drag notes in time or in pitch only (or hold ${mod})`}
          onPress={() => dispatch(setAxisLock(!axisLock))}
          isActive={axisLock}
        />
      </Group>
      <Divider />
      <Group>
        <IconButtonWrapper
          icon={<ContentCut />}
          tooltip={`Cut (${mod}+X)`}
          onPress={actions.cut}
          disabled={!actions.hasSelection}
        />
        <IconButtonWrapper
          icon={<ContentPaste />}
          tooltip={`Paste (${mod}+V)`}
          onPress={actions.paste}
        />
        <IconButtonWrapper
          icon={<ControlPointDuplicate />}
          tooltip={`Duplicate (${mod}+D)`}
          onPress={actions.duplicate}
          disabled={!actions.hasSelection}
        />
        <IconButtonWrapper
          icon={<Delete />}
          tooltip="Delete (Del)"
          onPress={actions.deleteSelection}
          disabled={!actions.hasSelection}
        />
      </Group>
    </div>
  );
};
