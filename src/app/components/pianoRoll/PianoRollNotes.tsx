import { DraggableNote } from "@/app/components/pianoRoll/DraggableNote";
import { TICKS_IN_BEAT } from "@/app/data/clockConstants";
import { OctaveNote } from "@/app/data/notes";
import { NOTE_HEIGHT, PIXELS_PER_TICK } from "@/app/data/pianoRollConstants";
import { parseChordNoteAndAlterations } from "@/app/engine/chords/chordParser";
import { ChordOrNote } from "@/app/engine/eventsByTick";

interface PianoRollNotesProps {
  notes: { tick: number; events: ChordOrNote[] }[];
  onNoteMove: (noteId: string, newTick: number, newPitch: number) => void;
}

export const PianoRollNotes: React.FC<PianoRollNotesProps> = ({
  notes,
  onNoteMove,
}) => {
  const getPitchPosition = (octaveNote: OctaveNote): number => {
    const { octave, note } = octaveNote;
    const octavePosition = octave * 12 * NOTE_HEIGHT;
    const notePosition = note * NOTE_HEIGHT;
    return octavePosition + notePosition;
  };

  return (
    <>
      {notes.flatMap(({ tick, events }) =>
        events.map((event, index) => {
          const isChord = "chord" in event;
          let octaveNote: OctaveNote;
          if (isChord) {
            const { chordBaseNote } = parseChordNoteAndAlterations(
              event.chord!.chord
            );
            octaveNote = { octave: 5, note: chordBaseNote };
          } else {
            octaveNote = event.note!.note;
          }
          const duration = TICKS_IN_BEAT * PIXELS_PER_TICK;
          const yPosition = getPitchPosition(octaveNote);
          const xPosition = tick * PIXELS_PER_TICK;
          const noteId = `${tick}-${index}`;

          return (
            <DraggableNote
              key={noteId}
              noteId={noteId}
              x={xPosition}
              y={yPosition}
              width={duration}
              height={NOTE_HEIGHT}
              isChord={isChord}
              onNoteMove={onNoteMove}
            />
          );
        })
      )}
    </>
  );
};
