import { usePianoRoll } from "@/app/context/PianoRollProvider";
import { deleteEvents } from "@/app/engine/pianoRoll/operations";
import { useEffect, useLayoutEffect, useRef } from "react";

const isTyping = (target: EventTarget | null) =>
  target instanceof HTMLElement &&
  (target.isContentEditable ||
    ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName));

export const usePianoRollShortcuts = () => {
  const pianoRoll = usePianoRoll();
  // the listener stays put and reads the latest state through the ref
  const latest = useRef(pianoRoll);
  useLayoutEffect(() => {
    latest.current = pianoRoll;
  });

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isTyping(e.target)) return;
      const { data, events, selection, setSelection, apply, undo, redo } =
        latest.current;
      if (!data) return;
      const mod = e.ctrlKey || e.metaKey;
      const key = e.key.toLowerCase();

      if (key === "delete" || key === "backspace") {
        apply(deleteEvents(data, selection));
      } else if (key === "escape") {
        setSelection([]);
      } else if (mod && key === "z" && !e.shiftKey) {
        undo();
      } else if (mod && (key === "y" || (key === "z" && e.shiftKey))) {
        redo();
      } else if (mod && key === "a") {
        setSelection(events.map(({ event }) => event.id));
      } else {
        return;
      }
      e.preventDefault();
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);
};
