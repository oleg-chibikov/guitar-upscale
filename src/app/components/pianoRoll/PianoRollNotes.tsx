import { DraggableNote } from "@/app/components/pianoRoll/DraggableNote";
import { usePianoRoll } from "@/app/context/PianoRollProvider";
import { TICKS_IN_BEAT } from "@/app/data/clockConstants";
import { OctaveNote } from "@/app/data/notes";
import {
  NOTE_HEIGHT,
  OCTAVE_COUNT,
  PIXELS_PER_TICK,
} from "@/app/data/pianoRollConstants";
import { parseChordNoteAndAlterations } from "@/app/engine/chords/chordParser";
import { getPitchPosition } from "@/app/helpers/pianoRollHelper";

export const PianoRollNotes: React.FC = () => {
  const { notes, onNoteMove } = usePianoRoll();
  return (
    <>
      {notes.flatMap(({ tick, events }) =>
        events.map((event) => {
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
          const yPosition = getPitchPosition({
            note: octaveNote.note,
            octave: OCTAVE_COUNT - octaveNote.octave - 1,
          });
          const xPosition = tick * PIXELS_PER_TICK;

          return (
            <DraggableNote
              key={event.id}
              noteEvent={event}
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
