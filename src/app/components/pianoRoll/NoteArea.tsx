import { NoteBlock } from "@/app/components/pianoRoll/NoteBlock";
import { useNoteAreaInteraction } from "@/app/components/pianoRoll/useNoteAreaInteraction";
import { usePianoRoll } from "@/app/context/PianoRollProvider";
import { usePianoRollView } from "@/app/context/PianoRollViewProvider";
import { Note } from "@/app/data/notes";
import { ChordOrNote, getChordOrNoteText } from "@/app/engine/eventsByTick";
import { pitchToY, tickToX, Zoom } from "@/app/engine/pianoRoll/geometry";
import {
  getEventDuration,
  getEventPitch,
  isChordEvent,
  withPitch,
} from "@/app/engine/pianoRoll/pianoRollEvent";
import { PianoRollTool } from "@/app/store/pianoRollSlice";
import React, { CSSProperties, ReactNode, RefObject, useRef } from "react";

interface NoteAreaProps {
  zoom: Zoom;
  width: number;
  height: number;
  snapTicks: number;
  scalePattern: Set<Note> | undefined;
  tool: PianoRollTool;
  scrollerRef: RefObject<HTMLDivElement | null>;
  gridStyle: CSSProperties;
  className?: string;
  children?: ReactNode;
}

const toolCursor: Record<PianoRollTool, string> = {
  [PianoRollTool.Select]: "cursor-default",
  [PianoRollTool.Draw]: "cursor-crosshair",
  [PianoRollTool.Erase]: "cursor-cell",
};

export const NoteArea: React.FC<NoteAreaProps> = ({
  zoom,
  width,
  height,
  snapTicks,
  scalePattern,
  tool,
  scrollerRef,
  gridStyle,
  className,
  children,
}) => {
  const areaRef = useRef<HTMLDivElement>(null);
  const { events, selection } = usePianoRoll();
  const { zoomTo } = usePianoRollView();
  const { preview, handlers } = useNoteAreaInteraction({
    areaRef,
    scrollerRef,
    zoom,
    snapTicks,
    scalePattern,
    tool,
    zoomTo,
  });

  const block = (
    tick: number,
    event: ChordOrNote,
    pitch: number,
    selected: boolean,
    ghost = false,
    key = event.id
  ) => {
    const label =
      pitch === getEventPitch(event)
        ? getChordOrNoteText(event)
        : getChordOrNoteText(withPitch(event, pitch)?.event ?? event);
    return (
      <NoteBlock
        key={key}
        id={event.id}
        x={tickToX(tick, zoom)}
        y={pitchToY(pitch, zoom)}
        width={getEventDuration(event) * zoom.pixelsPerTick}
        height={zoom.noteHeight}
        label={label}
        isChord={isChordEvent(event)}
        selected={selected}
        ghost={ghost}
      />
    );
  };

  const blocks: ReactNode[] = [];
  const ghosts: ReactNode[] = [];
  for (const { tick, event } of events) {
    const selected = selection.has(event.id);
    const pitch = getEventPitch(event);
    if (preview?.kind === "erase" && preview.ids.has(event.id)) {
      continue;
    }
    if (preview?.kind === "move") {
      const target = preview.targets.get(event.id);
      if (target) {
        if (preview.copy) {
          blocks.push(block(tick, event, pitch, false));
          ghosts.push(
            block(target.tick, event, target.pitch, true, true, `copy-${event.id}`)
          );
        } else {
          blocks.push(block(target.tick, event, target.pitch, selected));
        }
        continue;
      }
    }
    if (preview?.kind === "resize") {
      const target = preview.targets.get(event.id);
      if (target) {
        blocks.push(
          block(target.tick, { ...event, duration: target.duration }, pitch, selected)
        );
        continue;
      }
    }
    blocks.push(block(tick, event, pitch, selected));
  }
  if (preview?.kind === "draw") {
    ghosts.push(
      block(preview.tick, preview.event, getEventPitch(preview.event), true, true)
    );
  }

  return (
    <div
      ref={areaRef}
      className={`${className ?? ""} relative touch-none select-none ${toolCursor[tool]}`}
      style={{ width, height, ...gridStyle }}
      {...handlers}
    >
      {blocks}
      {ghosts}
      {preview?.kind === "rubber" && (
        <div
          className="absolute border border-white bg-white/15 pointer-events-none z-[3]"
          style={{
            left: preview.x,
            top: preview.y,
            width: preview.width,
            height: preview.height,
          }}
        />
      )}
      {children}
    </div>
  );
};
