import { PianoRollSnapSelector } from "@/app/components/pianoRoll/toolbar/PianoRollSnapSelector";
import {
  PianoRollTrackEdits,
  PianoRollTrackPicker,
} from "@/app/components/pianoRoll/toolbar/PianoRollTrackControls";
import { Group } from "@/app/components/pianoRoll/toolbar/ToolbarGroup";
import { PianoRollVelocityControl } from "@/app/components/pianoRoll/toolbar/PianoRollVelocityControl";
import {
  altKey,
  modKey,
} from "@/app/components/pianoRoll/toolbar/shortcutText";
import { usePianoRollActions } from "@/app/components/pianoRoll/usePianoRollActions";
import { usePianoRollTransport } from "@/app/components/pianoRoll/usePianoRollTransport";
import {
  QuantizeSelector,
  useQuantize,
} from "@/app/components/quantize/QuantizeSelector";
import { IconButtonWrapper } from "@/app/components/uiFramework/IconButton";
import { SelectWrapper } from "@/app/components/uiFramework/SelectWrapper";
import { usePianoRoll } from "@/app/context/PianoRollProvider";
import { usePianoRollView } from "@/app/context/PianoRollViewProvider";
import { useScaleContext } from "@/app/context/ScaleProvider";
import { NOTE_COUNT } from "@/app/data/notes";
import { ZOOM_STEP } from "@/app/data/pianoRollConstants";
import { usePianoRollSelector } from "@/app/hooks/storeHooks";
import {
  PianoRollTool,
  setAxisLock,
  setCopyMode,
  setFollowPlayback,
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
import AlignHorizontalLeft from "@mui/icons-material/AlignHorizontalLeft";
import Edit from "@mui/icons-material/Edit";
import FitScreen from "@mui/icons-material/FitScreen";
import KeyboardArrowDown from "@mui/icons-material/KeyboardArrowDown";
import KeyboardArrowUp from "@mui/icons-material/KeyboardArrowUp";
import KeyboardDoubleArrowDown from "@mui/icons-material/KeyboardDoubleArrowDown";
import KeyboardDoubleArrowUp from "@mui/icons-material/KeyboardDoubleArrowUp";
import KeyboardTab from "@mui/icons-material/KeyboardTab";
import UnfoldLess from "@mui/icons-material/UnfoldLess";
import UnfoldMore from "@mui/icons-material/UnfoldMore";
import ZoomIn from "@mui/icons-material/ZoomIn";
import ZoomOut from "@mui/icons-material/ZoomOut";
import LibraryMusic from "@mui/icons-material/LibraryMusic";
import MoreHoriz from "@mui/icons-material/MoreHoriz";
import NearMe from "@mui/icons-material/NearMe";
import PlayArrow from "@mui/icons-material/PlayArrow";
import SkipPrevious from "@mui/icons-material/SkipPrevious";
import Stop from "@mui/icons-material/Stop";
import Redo from "@mui/icons-material/Redo";
import Undo from "@mui/icons-material/Undo";
import React, { ReactNode, useState } from "react";
import { useDispatch } from "react-redux";
import { createTheme, Theme, ThemeProvider } from "@mui/material";

// the toolbar stays dark in both app themes, so its buttons and fields drop the app colours
const toolbarTheme = (outer: Theme) =>
  createTheme(outer, {
    components: {
      MuiIconButton: {
        styleOverrides: {
          root: {
            backgroundColor: "transparent",
            color: "#d4d4d4",
            "&:hover": { backgroundColor: "rgba(255, 255, 255, 0.1)" },
            "&.MuiIconButton-colorPrimary": {
              backgroundColor: "rgba(83, 118, 146, 0.55)",
              color: "#e0efff",
            },
            "&.Mui-disabled": { color: "rgba(255, 255, 255, 0.25)" },
          },
        },
      },
      MuiInputBase: {
        styleOverrides: { root: { color: "#e5e5e5" } },
      },
      MuiOutlinedInput: {
        styleOverrides: {
          root: { backgroundColor: "transparent" },
          notchedOutline: { border: "none" },
        },
      },
      MuiSelect: {
        styleOverrides: {
          select: { color: "#e5e5e5" },
          icon: { color: "rgba(255, 255, 255, 0.5)" },
        },
      },
    },
  });

const tools: { tool: PianoRollTool; icon: ReactNode; tooltip: string }[] = [
  {
    tool: PianoRollTool.Select,
    icon: <NearMe />,
    tooltip: "Select and move (1). Drag on empty space to select an area",
  },
  {
    tool: PianoRollTool.Draw,
    icon: <Edit />,
    tooltip: "Draw notes (2, or hold Alt). Drag right to make a note longer",
  },
  {
    tool: PianoRollTool.Erase,
    icon: <CleaningServices />,
    tooltip: "Erase notes (3). Drag across notes to erase them all",
  },
];

const transposeButtons: {
  steps: number;
  octave: boolean;
  icon: ReactNode;
  key: string;
}[] = [
  {
    steps: -1,
    octave: true,
    icon: <KeyboardDoubleArrowDown />,
    key: "Shift+Down",
  },
  { steps: -1, octave: false, icon: <KeyboardArrowDown />, key: "Down" },
  { steps: 1, octave: false, icon: <KeyboardArrowUp />, key: "Up" },
  { steps: 1, octave: true, icon: <KeyboardDoubleArrowUp />, key: "Shift+Up" },
];

export const PianoRollToolbar: React.FC = () => {
  const {
    undo,
    redo,
    canUndo,
    canRedo,
    undoLabel,
    redoLabel,
    sources,
    source,
    setSourceId,
  } = usePianoRoll();
  const actions = usePianoRollActions();
  const { zoomBy, zoomToFit } = usePianoRollView();
  const transport = usePianoRollTransport();
  const tool = usePianoRollSelector((s) => s.tool);
  const snapToScale = usePianoRollSelector((s) => s.snapToScale);
  const { scalePattern } = useScaleContext();
  const isChromatic = scalePattern.size === NOTE_COUNT;
  const copyMode = usePianoRollSelector((s) => s.copyMode);
  const axisLock = usePianoRollSelector((s) => s.axisLock);
  const followPlayback = usePianoRollSelector((s) => s.followPlayback);
  const quantize = useQuantize();
  const dispatch = useDispatch();
  const mod = modKey();
  const [showMore, setShowMore] = useState(false);
  const [renaming, setRenaming] = useState(false);

  return (
    <ThemeProvider theme={toolbarTheme}>
      <div className="flex flex-col gap-1.5 border-b border-neutral-700 bg-neutral-800 px-1.5 py-1.5 md:flex-row md:flex-wrap md:items-center">
        {/* a narrow screen keeps one row of main buttons. The rest opens with More */}
        <div className="flex flex-row items-center gap-1.5 overflow-x-auto md:contents">
          {sources.length > 1 && (
            <Group>
              <SelectWrapper
                className="min-w-24"
                tooltip="Track to edit: the melody or a looper channel"
                options={sources.map(({ id, label }) => ({ value: id, label }))}
                value={source?.id ?? ""}
                onChange={(value) => setSourceId(String(value))}
              />
            </Group>
          )}
          <PianoRollTrackPicker renaming={renaming} setRenaming={setRenaming} />
          <Group>
            <IconButtonWrapper
              icon={<SkipPrevious />}
              tooltip="Move the playhead to the start (Home)"
              onPress={() => transport.seekTo(0)}
              disabled={transport.isLoop}
            />
            <IconButtonWrapper
              icon={transport.isPlaying ? <Stop /> : <PlayArrow />}
              tooltip={
                transport.isPlaying
                  ? "Stop (Space)"
                  : transport.isLoop
                    ? "Play the loop (Space)"
                    : "Play these notes from the playhead (Space)"
              }
              onPress={() => void transport.togglePlay()}
              isActive={transport.isPlaying}
            />
          </Group>
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
          <Group>
            {tools.map(({ tool: value, icon, tooltip }) => (
              <IconButtonWrapper
                key={value}
                icon={icon}
                tooltip={tooltip.replace("Alt", altKey())}
                onPress={() => dispatch(setPianoRollTool(value))}
                isActive={tool === value}
              />
            ))}
          </Group>
          <Group className="ml-auto md:hidden">
            <IconButtonWrapper
              icon={<MoreHoriz />}
              tooltip={showMore ? "Hide the other buttons" : "More buttons"}
              onPress={() => setShowMore(!showMore)}
              isActive={showMore}
            />
          </Group>
        </div>
        <div
          className={`${showMore ? "flex" : "hidden"} flex-row flex-wrap items-center gap-1.5 md:contents`}
        >
          <PianoRollTrackEdits renaming={renaming} setRenaming={setRenaming} />
          <Group>
            <PianoRollSnapSelector />
            <IconButtonWrapper
              icon={<LibraryMusic />}
              tooltip={
                isChromatic
                  ? "Keep notes in the scale: the scale has all 12 notes, so pick another scale to use it"
                  : "Keep notes in the scale when moving and drawing"
              }
              onPress={() => dispatch(setSnapToScale(!snapToScale))}
              isActive={snapToScale && !isChromatic}
              toggle
              disabled={isChromatic}
            />
          </Group>
          <Group>
            <QuantizeSelector className="h-7" />
            <IconButtonWrapper
              icon={<AlignHorizontalLeft />}
              tooltip={`Quantize: move ${actions.hasSelection ? "the selected" : "all"} notes onto the ${quantize} grid (Q)`}
              onPress={actions.quantize}
            />
          </Group>
          <Group>
            {transposeButtons.map(({ steps, octave, icon, key }) => (
              <IconButtonWrapper
                key={key}
                icon={icon}
                tooltip={`Move ${actions.hasSelection ? "the selected" : "all"} notes ${steps > 0 ? "up" : "down"} ${octave ? "an octave" : snapToScale && !isChromatic ? "a scale step" : "a semitone"} (${key})`}
                onPress={() => actions.transpose(steps, octave, true)}
              />
            ))}
          </Group>
          <Group>
            <IconButtonWrapper
              icon={<ContentCopy />}
              tooltip={`Drag copies notes (or hold ${altKey()})`}
              onPress={() => dispatch(setCopyMode(!copyMode))}
              isActive={copyMode}
              toggle
            />
            <IconButtonWrapper
              icon={<CompareArrows />}
              tooltip={`Drag notes in time or in pitch only (or hold ${mod})`}
              onPress={() => dispatch(setAxisLock(!axisLock))}
              isActive={axisLock}
              toggle
            />
          </Group>
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
          <PianoRollVelocityControl />
          <Group>
            <IconButtonWrapper
              icon={<ZoomOut />}
              tooltip="Zoom out (G, or Ctrl+wheel)"
              onPress={() => zoomBy(1 / ZOOM_STEP, 1)}
            />
            <IconButtonWrapper
              icon={<ZoomIn />}
              tooltip="Zoom in (H, or Ctrl+wheel)"
              onPress={() => zoomBy(ZOOM_STEP, 1)}
            />
            <IconButtonWrapper
              icon={<UnfoldLess />}
              tooltip="Shorter rows (Shift+G, or Alt+wheel)"
              onPress={() => zoomBy(1, 1 / ZOOM_STEP)}
            />
            <IconButtonWrapper
              icon={<UnfoldMore />}
              tooltip="Taller rows (Shift+H, or Alt+wheel)"
              onPress={() => zoomBy(1, ZOOM_STEP)}
            />
            <IconButtonWrapper
              icon={<FitScreen />}
              tooltip="Fit all notes (F)"
              onPress={zoomToFit}
            />
            <IconButtonWrapper
              icon={<KeyboardTab />}
              tooltip="Follow the playhead during playback. The view stays put while notes are selected"
              onPress={() => dispatch(setFollowPlayback(!followPlayback))}
              isActive={followPlayback}
              toggle
            />
          </Group>
        </div>
      </div>
    </ThemeProvider>
  );
};
