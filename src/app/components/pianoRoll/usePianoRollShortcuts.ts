import { usePianoRollActions } from "@/app/components/pianoRoll/usePianoRollActions";
import { usePianoRollTransport } from "@/app/components/pianoRoll/usePianoRollTransport";
import { usePianoRoll } from "@/app/context/PianoRollProvider";
import { usePianoRollView } from "@/app/context/PianoRollViewProvider";
import { ZOOM_STEP } from "@/app/data/pianoRollConstants";
import { PianoRollTool, setPianoRollTool } from "@/app/store/pianoRollSlice";
import { useEffect, useLayoutEffect, useRef } from "react";
import { useDispatch } from "react-redux";

// keys typed into a field or an open dropdown belong to that control
const isTyping = (target: EventTarget | null) =>
  target instanceof HTMLElement &&
  target.closest(
    'input, textarea, select, [contenteditable="true"], [aria-expanded="true"], [role="listbox"], [role="menu"]'
  ) !== null;

const isDropdown = (target: EventTarget | null) =>
  target instanceof HTMLElement && target.closest('[role="combobox"]') !== null;

const toolKeys: Record<string, PianoRollTool> = {
  "1": PianoRollTool.Select,
  "2": PianoRollTool.Draw,
  "3": PianoRollTool.Erase,
};

export const usePianoRollShortcuts = () => {
  const { undo, redo, chordToChoose } = usePianoRoll();
  const actions = usePianoRollActions();
  const { zoomBy, zoomToFit } = usePianoRollView();
  const { togglePlay, seekTo } = usePianoRollTransport();
  const dispatch = useDispatch();
  // the listener stays put and reads the latest state through the ref
  // the chord dialog on top takes the keyboard
  const paused = chordToChoose !== undefined;
  const latest = useRef({ undo, redo, actions, zoomBy, zoomToFit, togglePlay, seekTo, paused });
  useLayoutEffect(() => {
    latest.current = { undo, redo, actions, zoomBy, zoomToFit, togglePlay, seekTo, paused };
  });

  useEffect(() => {
    // runs before the main Space handler, which loads a new melody, and tells it to skip.
    // Escape clears the selection before it gets to close the dialog
    const handleEarlyKeys = (e: KeyboardEvent) => {
      if (latest.current.paused || isTyping(e.target)) return;
      if (e.code === "Space" && !isDropdown(e.target)) {
        e.preventDefault();
        void latest.current.togglePlay();
      } else if (e.key === "Escape" && latest.current.actions.hasSelection) {
        e.preventDefault();
        e.stopPropagation();
        latest.current.actions.deselect();
      }
    };
    document.addEventListener("keydown", handleEarlyKeys, { capture: true });
    return () =>
      document.removeEventListener("keydown", handleEarlyKeys, {
        capture: true,
      });
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // a focused dropdown already used this key, for example an arrow to open its list
      if (latest.current.paused || isTyping(e.target) || e.defaultPrevented) {
        return;
      }
      const { undo, redo, actions, zoomBy, zoomToFit, seekTo } = latest.current;
      const mod = e.ctrlKey || e.metaKey;
      const key = e.key.toLowerCase();

      if (key === "delete" || key === "backspace") {
        actions.deleteSelection();
      } else if (mod && key === "z" && !e.shiftKey) {
        undo();
      } else if (mod && (key === "y" || (key === "z" && e.shiftKey))) {
        redo();
      } else if (mod && key === "a") {
        actions.selectAll();
      } else if (mod && key === "c") {
        actions.copy();
      } else if (mod && key === "x") {
        actions.cut();
      } else if (mod && key === "v") {
        actions.paste();
      } else if (mod && key === "d") {
        actions.duplicate();
      } else if (key === "arrowup" || key === "arrowdown") {
        actions.transpose(key === "arrowup" ? 1 : -1, e.shiftKey);
      } else if (key === "arrowleft" || key === "arrowright") {
        actions.nudge(key === "arrowright" ? 1 : -1);
      } else if (!mod && (key === "g" || key === "h")) {
        // G and H zoom out and in as in Cubase. Shift zooms pitch
        const factor = key === "h" ? ZOOM_STEP : 1 / ZOOM_STEP;
        zoomBy(e.shiftKey ? 1 : factor, e.shiftKey ? factor : 1);
      } else if (!mod && key === "q") {
        actions.quantize();
      } else if (key === "home") {
        seekTo(0);
      } else if (!mod && key === "f") {
        zoomToFit();
      } else if (!mod && !e.altKey && toolKeys[key] !== undefined) {
        dispatch(setPianoRollTool(toolKeys[key]));
      } else {
        return;
      }
      e.preventDefault();
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [dispatch]);
};
