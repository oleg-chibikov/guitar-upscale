import { Instrument } from "@/app/data/instruments";
import {
  getNoteText,
  OctaveNote,
  serializeOctaveNote,
  StringOctaveNote,
} from "@/app/data/notes";
import { ChordWithPlayMetadata } from "@/app/engine/eventBus";
import { IdGenerator } from "@/app/engine/eventIdGenerator";
import { octaveNoteToStringOctaveNoteMap } from "@/app/engine/generateNeckRepresentation";

export type NoteEvent = {
  note: StringOctaveNote;
  trackNumber: number;
  instrument?: Instrument;
  velocity?: number;
  looperChannel?: number;
};

export type ChordOrNote = {
  id: string;
  note?: NoteEvent;
  chord?: ChordWithPlayMetadata;
};
export class EventsByTick {
  private events: Map<number, ChordOrNote[]>;
  private eventsById: Map<string, { tick: number; event: ChordOrNote }>;

  constructor() {
    this.events = new Map<number, ChordOrNote[]>();
    this.eventsById = new Map<string, { tick: number; event: ChordOrNote }>();
  }

  private generateIdPrefix(value: NoteEvent | ChordWithPlayMetadata): string {
    return "note" in value
      ? `note-t${value.trackNumber}-${value.note.octave}-${getNoteText(
          value.note.note
        )}-${Date.now()}-`
      : `chord-${value.chord}-`;
  }

  addEventAtTick(tick: number, value: NoteEvent | ChordWithPlayMetadata): void {
    const id = IdGenerator.generate(this.generateIdPrefix(value));
    let chordOrNote: ChordOrNote;

    if ("note" in value) {
      chordOrNote = { id, note: value as NoteEvent };
    } else {
      chordOrNote = { id, chord: value as ChordWithPlayMetadata };
    }

    if (this.events.has(tick)) {
      this.events.get(tick)?.push(chordOrNote);
    } else {
      this.events.set(tick, [chordOrNote]);
    }

    this.eventsById.set(id, { tick, event: chordOrNote });
  }

  changeEvent(id: string, newPitch: OctaveNote, newTick: number): boolean {
    const eventInfo = this.eventsById.get(id);
    if (!eventInfo) return false;

    const { event, tick: oldTick } = eventInfo;

    // Change pitch for NoteEvent
    if (event.note) {
      const serializedOctaveNote = serializeOctaveNote(newPitch);
      const stringOctaveNotes =
        octaveNoteToStringOctaveNoteMap.get(serializedOctaveNote);
      if (stringOctaveNotes !== undefined && stringOctaveNotes.length > 0) {
        event.note.note = stringOctaveNotes[0];
      }
    }

    // Change pitch for ChordWithPlayMetadata
    else if (event.chord) {
      event.chord.chord = event.chord.chord.replace(
        /^[A-G#b]+/,
        getNoteText(newPitch.note)
      );
    }

    // Change position
    if (newTick !== oldTick) {
      const oldEvents = this.events.get(oldTick);
      if (oldEvents) {
        const index = oldEvents.findIndex((e) => e.id === id);
        if (index !== -1) {
          const [removed] = oldEvents.splice(index, 1);

          // Ensure the event is added to the new tick
          if (!this.events.has(newTick)) {
            this.events.set(newTick, []);
          }
          this.events.get(newTick)!.push(removed);

          // Update eventsById
          this.eventsById.set(id, { tick: newTick, event: removed });

          if (oldEvents.length === 0) {
            this.events.delete(oldTick);
          }
        }
      }
    }

    return true;
  }
  removeEvent(id: string): boolean {
    const eventInfo = this.eventsById.get(id);
    if (eventInfo) {
      const tick = eventInfo.tick;
      const events = this.events.get(tick);
      if (events) {
        const index = events.findIndex((e) => e.id === id);
        if (index !== -1) {
          events.splice(index, 1);
          if (events.length === 0) {
            this.events.delete(tick);
          }
          this.eventsById.delete(id);
          return true;
        }
      }
    }
    return false;
  }

  /**
   * Gets the events for a given tick (time).
   *
   * @param tick - The tick (time) to get events for
   * @returns An array of ChordOrNote or undefined if the key does not exist
   */
  getEvents(tick: number): ChordOrNote[] | undefined {
    return this.events.get(tick);
  }

  /**
   * Get the iterable collection of all events in sorted order.
   */
  get items() {
    return Array.from(this.events.keys())
      .sort((a, b) => a - b)
      .map((x) => ({ tick: x, events: this.events.get(x) }))
      .filter((x) => x.events?.length) as {
      tick: number;
      events: ChordOrNote[];
    }[];
  }

  /**
   *Checks if there are items
   */
  get hasItems(): boolean {
    return this.events.size > 0;
  }

  /**
   * Merges multiple EventsByTick instances into a new instance.
   *
   * @param others - The other EventsByTick instances to merge
   * @returns A new EventsByTick instance with merged events
   */
  static merge(...others: EventsByTick[]): EventsByTick {
    const merged = new EventsByTick();
    for (const other of others) {
      // Merge events
      other.events.forEach((value, key) => {
        if (merged.events.has(key)) {
          merged.events.get(key)?.push(...value);
        } else {
          merged.events.set(key, [...value]);
        }
      });

      // Merge eventsById
      other.eventsById.forEach((value, key) => {
        merged.eventsById.set(key, { ...value });
      });
    }
    return merged;
  }
}
