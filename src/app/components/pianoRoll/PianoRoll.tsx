import { NOTE_HEIGHT, PitchAxis } from "@/app/components/pianoRoll/PitchAxis";
import { OctaveNote } from "@/app/data/notes";
import { parseChordNoteAndAlterations } from "@/app/engine/chords/chordParser";
import { ChordOrNote } from "@/app/engine/eventsByTick";
import React, { useState } from "react";

interface PianoRollProps {
  notes: { tick: number; events: ChordOrNote[] }[];
}

const BEAT_WIDTH = 100; // Width of one beat in pixels
const TOTAL_BEATS = 32;
const TOTAL_WIDTH = TOTAL_BEATS * BEAT_WIDTH;

export const PianoRoll: React.FC<PianoRollProps> = ({ notes }) => {
  const [draggedNote, setDraggedNote] = useState<{
    id: string;
    startX: number;
    startY: number;
  } | null>(null);

  const renderNote = (note: ChordOrNote, tick: number, index: number) => {
    const isChord = "chord" in note;
    let octaveNote: OctaveNote;
    if (isChord) {
      const { chordBaseNote } = parseChordNoteAndAlterations(note.chord!.chord);
      octaveNote = { octave: 5, note: chordBaseNote };
    } else {
      octaveNote = note.note!.note;
    }
    const duration = 100; // You'll need to calculate this based on your tick system
    const yPosition = getPitchPosition(octaveNote);
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
          left: tick,
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

    // Vertical lines (beats)
    for (let i = 0; i <= TOTAL_BEATS; i++) {
      // Assuming 32 beats
      verticalLines.push(
        <div
          key={`v-${i}`}
          className="absolute top-0 bottom-0 border-l border-gray-700"
          style={{ left: `${i * BEAT_WIDTH}px` }}
        />
      );
    }

    return [...verticalLines];
  };

  return (
    <div
      className="relative w-full h-full bg-gray-100 overflow-x-auto overflow-y-hidden"
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
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
  );
};

const OCTAVE_HEIGHT = NOTE_HEIGHT * 12; // Height of an octave (12 semitones)
const MAX_OCTAVE = 8; // Assuming 9 octaves (0-8)

const getPitchPosition = (octaveNote: OctaveNote): number => {
  const { octave, note } = octaveNote;
  const octavePosition = (MAX_OCTAVE - octave) * OCTAVE_HEIGHT; // Invert octave so that higher octaves are at the top
  const notePosition = note * NOTE_HEIGHT; // Use the enum value directly

  return octavePosition + notePosition;
};
