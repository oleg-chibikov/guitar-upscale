import { NotePlayEvent } from "@/app/data/midiParser/notePlayEvent";
import { serializeOctaveNote } from "@/app/data/notes";
import { TICKS_IN_HALF_BEAT } from "@/app/engine/clock/clockConstants";

const TOLERANCE_TICKS = TICKS_IN_HALF_BEAT / 2; // we assume a chord consists of notes that are close to each other within half beat

export function groupEventsByTickWithTolerance(
  events: NotePlayEvent[]
): Map<number, NotePlayEvent[]> {
  // Assume events are already sorted
  const groupedEventsMap: Map<number, NotePlayEvent[]> = new Map();
  let currentGroup: NotePlayEvent[] = [];
  let currentNotes: Set<string> = new Set(); // To keep track of notes in the current group. Once we meet a note that's already in a group - we start a new one
  let toleranceWindowStart: number | null = null;

  for (const currentEvent of events) {
    if (toleranceWindowStart === null) {
      // If tolerance window is not set, set it to the current event's tick
      toleranceWindowStart = currentEvent.tick;
    }

    const serialized = serializeOctaveNote(currentEvent.octaveNote);
    if (
      currentEvent.tick - toleranceWindowStart <= TOLERANCE_TICKS &&
      !currentNotes.has(serialized)
    ) {
      // If the event falls within the tolerance window and the note is not already in the current group, add it to the current group
      currentGroup.push(currentEvent);
      currentNotes.add(serialized);
    } else {
      // If the event is outside the tolerance window or the note is already in the current group, add the current group to the map
      if (toleranceWindowStart !== null) {
        groupedEventsMap.set(toleranceWindowStart, currentGroup);
      }
      // Start a new group with the current event
      currentGroup = [currentEvent];
      currentNotes = new Set([serialized]);
      // Reset tolerance window start
      toleranceWindowStart = currentEvent.tick;
    }
  }

  // Add the last group to the map
  if (currentGroup.length > 0 && toleranceWindowStart !== null) {
    groupedEventsMap.set(toleranceWindowStart, currentGroup);
  }

  return groupedEventsMap;
}
