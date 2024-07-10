import { EventsByTick } from "@/app/engine/eventsByTick";

export interface NoteRecorder {
  addEvents(eventsByTick: EventsByTick): void;
}
