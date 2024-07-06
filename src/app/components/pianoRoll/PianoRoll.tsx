import { NOTE_HEIGHT, PitchAxis } from "@/app/components/pianoRoll/PitchAxis";
import { BEATS_IN_BAR, TICKS_IN_BEAT } from "@/app/data/clockConstants";
import { OctaveNote } from "@/app/data/notes";
import { parseChordNoteAndAlterations } from "@/app/engine/chords/chordParser";
import { ChordOrNote } from "@/app/engine/eventsByTick";
import React, { useRef, useState } from "react";

interface PianoRollProps {
  notes: { tick: number; events: ChordOrNote[] }[];
}

const PIXELS_PER_TICK = 2;
const BEAT_WIDTH = TICKS_IN_BEAT * PIXELS_PER_TICK;
const TOTAL_BEATS = 32;
const TOTAL_WIDTH = TOTAL_BEATS * BEAT_WIDTH;

export const PianoRoll: React.FC<PianoRollProps> = ({ notes }) => {
  const [draggedNote, setDraggedNote] = useState<{
    id: string;
    startX: number;
    startY: number;
  } | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const renderNote = (note: ChordOrNote, tick: number, index: number) => {
    const isChord = "chord" in note;
    let octaveNote: OctaveNote;
    if (isChord) {
      const { chordBaseNote } = parseChordNoteAndAlterations(note.chord!.chord);
      octaveNote = { octave: 5, note: chordBaseNote };
    } else {
      octaveNote = note.note!.note;
    }
    const duration = TICKS_IN_BEAT * PIXELS_PER_TICK; // Default duration of one beat
    const yPosition = getPitchPosition(octaveNote);
    const xPosition = tick * PIXELS_PER_TICK;
    const id = `${tick}-${index}`;

    const handleMouseDown = (e: React.MouseEvent) => {
      setDraggedNote({
        id,
        startX: e.clientX,
        startY: e.clientY,
      });
    };

    return (
      <div
        key={id}
        className={`absolute ${
          isChord ? "bg-blue-500" : "bg-green-500"
        } border-gray-300 border cursor-move`}
        style={{
          left: xPosition,
          top: yPosition,
          width: duration,
          height: NOTE_HEIGHT,
        }}
        onMouseDown={handleMouseDown}
      />
    );
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (draggedNote) {
      const noteElement = document.getElementById(draggedNote.id);
      if (noteElement) {
        const dx = e.clientX - draggedNote.startX;
        const dy = e.clientY - draggedNote.startY;
        noteElement.style.left = `${parseInt(noteElement.style.left) + dx}px`;
        noteElement.style.top = `${parseInt(noteElement.style.top) + dy}px`;
        setDraggedNote({
          ...draggedNote,
          startX: e.clientX,
          startY: e.clientY,
        });
      }
    }
  };

  const handleMouseUp = () => {
    setDraggedNote(null);
    // Here you would update the note's position in your data structure
  };

  const renderGrid = () => {
    const verticalLines = [];

    // Vertical lines (bars and beats)
    for (let bar = 0; bar <= TOTAL_BEATS / BEATS_IN_BAR; bar++) {
      for (let beat = 0; beat < BEATS_IN_BAR; beat++) {
        const xPosition = (bar * BEATS_IN_BAR + beat) * BEAT_WIDTH;
        verticalLines.push(
          <div
            key={`v-${bar}-${beat}`}
            className={`absolute top-0 bottom-0 ${
              beat === 0
                ? "border-l-2 border-gray-300"
                : "border-l border-gray-500"
            }`}
            style={{ left: `${xPosition}px` }}
          />
        );
      }
    }

    return verticalLines;
  };

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full bg-gray-100 overflow-auto"
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      <div style={{ width: `${TOTAL_WIDTH}px`, height: "100%" }}>
        <PitchAxis
          className="absolute"
          showNoteLabels={false}
          darkNoteColor="bg-gray-900"
          lightNoteColor="bg-gray-800"
          noteBorderColor="border-gray-800"
          width={TOTAL_WIDTH}
        />
        {renderGrid()}
        {notes.map(({ tick, events }) =>
          events.map((event, index) => renderNote(event, tick, index))
        )}
      </div>
    </div>
  );
};

const OCTAVE_HEIGHT = NOTE_HEIGHT * 12;
const MAX_OCTAVE = 8;

const getPitchPosition = (octaveNote: OctaveNote): number => {
  const { octave, note } = octaveNote;
  const octavePosition = (MAX_OCTAVE - octave) * OCTAVE_HEIGHT;
  const notePosition = note * NOTE_HEIGHT;

  return octavePosition + notePosition;
};
