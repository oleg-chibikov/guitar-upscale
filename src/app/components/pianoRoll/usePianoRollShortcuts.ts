import { usePianoRollActions } from "@/app/components/pianoRoll/usePianoRollActions";
import { usePianoRollTransport } from "@/app/components/pianoRoll/usePianoRollTransport";
import { usePianoRoll } from "@/app/context/PianoRollProvider";
import { usePianoRollView } from "@/app/context/PianoRollViewProvider";
import { ZOOM_STEP } from "@/app/data/pianoRollConstants";
import { PianoRollTool, setPianoRollTool } from "@/app/store/pianoRollSlice";
import { Options, useHotkeys } from "react-hotkeys-hook";
import { useDispatch } from "react-redux";

// keys typed into a field or an open dropdown belong to that control
const isTyping = (target: EventTarget | null) =>
  target instanceof HTMLElement &&
  target.closest(
    'input, textarea, select, [contenteditable="true"], [aria-expanded="true"], [role="listbox"], [role="menu"]',
  ) !== null;

const isDropdown = (target: EventTarget | null) =>
  target instanceof HTMLElement && target.closest('[role="combobox"]') !== null;

const toolKeys: Record<string, PianoRollTool> = {
  "1": PianoRollTool.Select,
  "2": PianoRollTool.Draw,
  "3": PianoRollTool.Erase,
};

export const usePianoRollShortcuts = () => {
  const {
    undo,
    redo,
    chordToChoose,
    tracks,
    activeTrack,
    setActiveTrack,
    toggleSolo,
  } = usePianoRoll();
  const actions = usePianoRollActions();
  const { zoomBy, zoomToFit } = usePianoRollView();
  const { togglePlay, seekTo } = usePianoRollTransport();
  const dispatch = useDispatch();
  // the chord dialog on top takes the keyboard
  const paused = chordToChoose !== undefined;
  // T steps through All tracks, then each track, then back to All
  const stepTrack = (direction: number) => {
    if (tracks.length < 2) return;
    const order = [undefined, ...tracks.map(({ trackNumber }) => trackNumber)];
    const index = order.indexOf(activeTrack?.trackNumber);
    setActiveTrack(order[(index + direction + order.length) % order.length]);
  };

  // runs before the main Space handler, which loads a new melody, and tells it to skip.
  // Escape clears the selection before it gets to close the dialog
  const early: Options = {
    eventListenerOptions: { capture: true },
    ignoreModifiers: true,
    ignoreEventWhen: (e) => paused || isTyping(e.target),
  };
  useHotkeys(
    "space",
    (e) => {
      if (isDropdown(e.target)) return;
      e.preventDefault();
      void togglePlay();
    },
    early,
  );
  useHotkeys(
    "escape",
    (e) => {
      if (!actions.hasSelection) return;
      e.preventDefault();
      e.stopPropagation();
      actions.deselect();
    },
    early,
  );

  // a focused dropdown already used the key, for example an arrow to open its list
  const main: Options = {
    preventDefault: true,
    ignoreEventWhen: (e) => paused || isTyping(e.target) || e.defaultPrevented,
  };
  useHotkeys("delete, backspace", () => actions.deleteSelection(), main);
  useHotkeys("mod+z", () => undo(), main);
  useHotkeys("mod+y, mod+shift+z", () => redo(), main);
  useHotkeys("mod+a", () => actions.selectAll(), main);
  useHotkeys("mod+c", () => actions.copy(), main);
  useHotkeys("mod+x", () => actions.cut(), main);
  useHotkeys("mod+v", () => actions.paste(), main);
  useHotkeys("mod+d", () => actions.duplicate(), main);
  useHotkeys(
    "up, down, shift+up, shift+down",
    (e, { keys }) =>
      actions.transpose(keys?.[0] === "arrowup" ? 1 : -1, e.shiftKey),
    main,
  );
  useHotkeys(
    "left, right",
    (_, { keys }) => actions.nudge(keys?.[0] === "arrowright" ? 1 : -1),
    main,
  );
  // G and H zoom out and in as in Cubase. Shift zooms pitch
  useHotkeys(
    "g, h, shift+g, shift+h",
    (e, { keys }) => {
      const factor = keys?.[0] === "h" ? ZOOM_STEP : 1 / ZOOM_STEP;
      zoomBy(e.shiftKey ? 1 : factor, e.shiftKey ? factor : 1);
    },
    main,
  );
  useHotkeys("q", () => actions.quantize(), main);
  useHotkeys("home", () => seekTo(0), main);
  useHotkeys("f", () => zoomToFit(), main);
  useHotkeys("t, shift+t", (e) => stepTrack(e.shiftKey ? -1 : 1), main);
  useHotkeys("s", () => toggleSolo(), main);
  useHotkeys(
    "1, 2, 3",
    (_, { keys }) => dispatch(setPianoRollTool(toolKeys[keys?.[0] ?? ""])),
    main,
  );
};
