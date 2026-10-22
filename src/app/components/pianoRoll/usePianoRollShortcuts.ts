import { usePianoRollActions } from "@/app/components/pianoRoll/usePianoRollActions";
import { usePianoRoll } from "@/app/context/PianoRollProvider";
import { PianoRollTool, setPianoRollTool } from "@/app/store/pianoRollSlice";
import { useEffect, useLayoutEffect, useRef } from "react";
import { useDispatch } from "react-redux";

// keys typed into a field or a dropdown belong to that control
const isTyping = (target: EventTarget | null) =>
  target instanceof HTMLElement &&
  target.closest(
    'input, textarea, select, [contenteditable="true"], [role="combobox"], [role="listbox"], [role="menu"]'
  ) !== null;

const toolKeys: Record<string, PianoRollTool> = {
  "1": PianoRollTool.Select,
  "2": PianoRollTool.Draw,
  "3": PianoRollTool.Erase,
};

export const usePianoRollShortcuts = () => {
  const { undo, redo } = usePianoRoll();
  const actions = usePianoRollActions();
  const dispatch = useDispatch();
  // the listener stays put and reads the latest state through the ref
  const latest = useRef({ undo, redo, actions });
  useLayoutEffect(() => {
    latest.current = { undo, redo, actions };
  });

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isTyping(e.target)) return;
      const { undo, redo, actions } = latest.current;
      const mod = e.ctrlKey || e.metaKey;
      const key = e.key.toLowerCase();

      if (key === "delete" || key === "backspace") {
        actions.deleteSelection();
      } else if (key === "escape") {
        actions.deselect();
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
