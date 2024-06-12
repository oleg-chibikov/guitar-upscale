import { NotePlayEvent } from "@/app/data/midiParser/notePlayEvent";
import { TICKS_IN_HALF_BEAT } from "@/app/engine/mainClock";

const TOLERANCE_TICKS = TICKS_IN_HALF_BEAT / 2; // we assume a chord consists of notes that are close to each other within half beat

export function groupEventsByTickWithTolerance(
  events: NotePlayEvent[]
): Map<number, NotePlayEvent[]> {
  // Assume events are already sorted
  const groupedEventsMap: Map<number, NotePlayEvent[]> = new Map();
  let currentGroup: NotePlayEvent[] = [];
  let toleranceWindowStart: number | null = null;

  for (const currentEvent of events) {
    if (toleranceWindowStart === null) {
      // If tolerance window is not set, set it to the current event's tick
      toleranceWindowStart = currentEvent.tick;
    }

    if (currentEvent.tick - toleranceWindowStart <= TOLERANCE_TICKS) {
      // If the event falls within the tolerance window, add it to the current group
      currentGroup.push(currentEvent);
    } else {
      // If the event is outside the tolerance window, add the current group to the map
      if (toleranceWindowStart !== null) {
        groupedEventsMap.set(toleranceWindowStart, currentGroup);
      }
      // Start a new group with the current event
      currentGroup = [currentEvent];
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
