import { usePianoRoll } from "@/app/context/PianoRollProvider";
import { MAX_VOLUME } from "@/app/data/volume";
import { setVelocity } from "@/app/engine/pianoRoll/operations";
import { playChordOrNote } from "@/app/engine/playerHelper";
import VolumeUp from "@mui/icons-material/VolumeUp";
import { Tooltip } from "@mui/material";
import React, { useState } from "react";

/**
 * The volume (MIDI velocity) of the selected notes. One drag makes one undo step
 */
export const PianoRollVelocityControl: React.FC = () => {
  const { data, selection, apply } = usePianoRoll();
  const [dragged, setDragged] = useState<number | undefined>();
  const notes = data
    ? Array.from(selection)
        .map((id) => data.getEvent(id)?.event)
        .filter((event) => event?.note !== undefined)
    : [];
  const value = dragged ?? notes[0]?.note?.velocity ?? MAX_VOLUME;

  const commit = () => {
    if (!data || dragged === undefined) return;
    setDragged(undefined);
    apply(setVelocity(data, selection, dragged));
    const first = notes[0] && data.getEvent(notes[0].id);
    if (first) playChordOrNote(first.event);
  };

  return (
    <Tooltip
      title={
        notes.length
          ? "Volume of the selected notes"
          : "Select notes to set their volume"
      }
    >
      <div className="flex flex-row items-center gap-1 px-1 text-gray-300">
        <VolumeUp fontSize="small" />
        <input
          type="range"
          aria-label="Note volume"
          className="w-20 cursor-pointer accent-primary-dark disabled:cursor-default"
          min={1}
          max={MAX_VOLUME}
          value={value}
          disabled={!notes.length}
          onChange={(e) => setDragged(Number(e.target.value))}
          onPointerUp={commit}
          onKeyUp={commit}
          onBlur={commit}
        />
        <span className="w-7 text-xs tabular-nums">
          {notes.length ? value : ""}
        </span>
      </div>
    </Tooltip>
  );
};
