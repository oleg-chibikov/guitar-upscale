import { usePianoRoll } from "@/app/context/PianoRollProvider";
import { useScaleContext } from "@/app/context/ScaleProvider";
import { getTicksForTimeSignature } from "@/app/data/clockConstants";
import { getClipboard, setClipboard } from "@/app/engine/pianoRoll/clipboard";
import {
  deleteEvents,
  getSpan,
  moveEvents,
  pasteEvents,
  resolveMove,
  resolveTranspose,
} from "@/app/engine/pianoRoll/operations";
import { playChordOrNote } from "@/app/engine/playerHelper";
import { usePianoRollSelector } from "@/app/hooks/storeHooks";
import { useMemo } from "react";

/**
 * Edits on the selection, shared by the toolbar and the keyboard shortcuts
 */
export const usePianoRollActions = () => {
  const { data, events, selection, setSelection, apply } = usePianoRoll();
  const { scalePattern } = useScaleContext();
  const snap = usePianoRollSelector((s) => s.pianoRollSnap);
  const snapToScale = usePianoRollSelector((s) => s.snapToScale);
  const snapTicks = getTicksForTimeSignature(snap);

  return useMemo(() => {
    const selected = () =>
      data
        ? Array.from(selection)
            .map((id) => data.getEvent(id))
            .filter((s) => s !== undefined)
        : [];

    const copy = () => {
      const states = selected();
      if (states.length) setClipboard(states);
      return states;
    };

    const pasteAt = (tick: number) => {
      if (data) apply(pasteEvents(data, getClipboard(), tick));
    };

    return {
      hasSelection: selection.size > 0,
      selectAll: () => setSelection(events.map(({ event }) => event.id)),
      deselect: () => setSelection([]),
      deleteSelection: () => {
        if (data) apply(deleteEvents(data, selection));
      },
      copy,
      cut: () => {
        if (data && copy().length) apply(deleteEvents(data, selection));
      },
      // without a playhead to aim at, a paste lands right after the copied notes
      paste: () => {
        const clipboard = getClipboard();
        if (clipboard.length) pasteAt(getSpan(clipboard).end);
      },
      pasteAt,
      duplicate: () => {
        const states = selected();
        if (!data || !states.length) return;
        apply(pasteEvents(data, states, getSpan(states).end));
      },
      transpose: (steps: number, octave: boolean) => {
        if (!data || !selection.size) return;
        const targets = octave
          ? resolveTranspose(data, selection, steps * 12)
          : resolveTranspose(
              data,
              selection,
              steps,
              snapToScale ? scalePattern : undefined
            );
        if (!targets.size) return;
        const result = moveEvents(data, targets, false);
        apply(result);
        const first = result.selection[0];
        const moved = first !== undefined ? data.getEvent(first) : undefined;
        if (moved) playChordOrNote(moved.event);
      },
      nudge: (steps: number) => {
        if (!data || !selection.size) return;
        apply(
          moveEvents(
            data,
            resolveMove(data, selection, steps * snapTicks, 0),
            false
          )
        );
      },
    };
  }, [data, events, selection, setSelection, apply, snapTicks, snapToScale, scalePattern]);
};
