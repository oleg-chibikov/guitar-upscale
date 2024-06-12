import { NotePlayEvent } from "@/app/data/midiParser/notePlayEvent";
import { StringOctaveNote, serializeOctaveNote } from "@/app/data/notes";
import { octaveNoteToStringOctaveNoteMap } from "@/app/engine/generateNeckRepresentation";

export function addIndividualNote(
  event: NotePlayEvent,
  previousNote: StringOctaveNote | undefined
) {
  const { octaveNote } = event;
  const serializedOctaveNote = serializeOctaveNote(octaveNote);
  const possibleStringOctaveNotes =
    octaveNoteToStringOctaveNoteMap.get(serializedOctaveNote);
  if (
    possibleStringOctaveNotes === undefined ||
    possibleStringOctaveNotes.length === 0
  ) {
    console.error(
      "note %s is not in the scale. Skipping it",
      serializedOctaveNote
    );
    return undefined;
  } else {
    return chooseBestPosition(possibleStringOctaveNotes, previousNote);
  }
}

function chooseBestPosition(
  positions: StringOctaveNote[],
  previousPosition: StringOctaveNote | undefined
): StringOctaveNote {
  if (!previousPosition) {
    // No previous position, choose the lowest fret
    return positions.reduce(
      (best, pos) => (pos.fret < best.fret ? pos : best),
      positions[0]
    );
  }

  // Minimize hand movement by choosing the closest position
  return positions.reduce((best, pos) => {
    const bestDistance =
      Math.abs(best.string - previousPosition.string) +
      Math.abs(best.fret - previousPosition.fret);
    const posDistance =
      Math.abs(pos.string - previousPosition.string) +
      Math.abs(pos.fret - previousPosition.fret);
    return posDistance < bestDistance ? pos : best;
  }, positions[0]);
}
