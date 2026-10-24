import { useQuantize } from "@/app/components/quantize/QuantizeSelector";
import { usePianoRoll } from "@/app/context/PianoRollProvider";
import { useScaleContext } from "@/app/context/ScaleProvider";
import { getTicksForTimeSignature } from "@/app/data/clockConstants";
import { getClipboard, setClipboard } from "@/app/engine/pianoRoll/clipboard";
import {
  deleteEvents,
  getSpan,
  moveEvents,
  pasteEvents,
  quantizeEvents,
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
  const {
    data,
    events,
    selection,
    setSelection,
    apply,
    playhead$,
    activeTrack,
    source,
  } = usePianoRoll();
  const isSong = source?.looperChannel === undefined;
  const { scalePattern } = useScaleContext();
  const snap = usePianoRollSelector((s) => s.pianoRollSnap);
  const snapToScale = usePianoRollSelector((s) => s.snapToScale);
  const snapTicks = getTicksForTimeSignature(snap);
  const quantizeTicks = getTicksForTimeSignature(useQuantize());

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
      if (data) apply(pasteEvents(data, getClipboard(), tick, activeTrack));
    };

    return {
      hasSelection: selection.size > 0,
      selectAll: () => setSelection(events.map(({ event }) => event.id)),
      deselect: () => setSelection([]),
      deleteSelection: () => {
        if (data) apply(deleteEvents(data, selection, isSong));
      },
      copy,
      cut: () => {
        if (data && copy().length) apply(deleteEvents(data, selection, isSong));
      },
      // as in Cubase, a paste lands at the playhead
      paste: () => pasteAt(playhead$.value),
      pasteAt,
      duplicate: () => {
        const states = selected();
        if (!data || !states.length) return;
        apply(pasteEvents(data, states, getSpan(states).end));
      },
      // the toolbar buttons move every note when nothing is selected, like quantize
      transpose: (steps: number, octave: boolean, orAll = false) => {
        const ids =
          selection.size || !orAll
            ? selection
            : new Set(events.map(({ event }) => event.id));
        if (!data || !ids.size) return;
        const targets = octave
          ? resolveTranspose(data, ids, steps * 12)
          : resolveTranspose(
              data,
              ids,
              steps,
              snapToScale ? scalePattern : undefined,
            );
        if (!targets.size) return;
        const result = moveEvents(data, targets, false);
        apply(result);
        const first = result.selection[0];
        const moved = first !== undefined ? data.getEvent(first) : undefined;
        if (moved) playChordOrNote(moved.event);
      },
      // with nothing selected, Cubase quantizes every note
      quantize: () => {
        if (!data) return;
        const ids = selection.size
          ? selection
          : events.map(({ event }) => event.id);
        apply(quantizeEvents(data, ids, quantizeTicks));
      },
      nudge: (steps: number) => {
        if (!data || !selection.size) return;
        apply(
          moveEvents(
            data,
            resolveMove(data, selection, steps * snapTicks, 0),
            false,
          ),
        );
      },
    };
  }, [
    data,
    events,
    selection,
    setSelection,
    apply,
    snapTicks,
    quantizeTicks,
    snapToScale,
    scalePattern,
    playhead$,
    activeTrack,
    isSong,
  ]);
};
