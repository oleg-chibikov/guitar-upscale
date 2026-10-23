import { Instrument } from "@/app/data/instruments";
import {
  getNoteText,
  serializeOctaveNote,
  StringOctaveNote,
} from "@/app/data/notes";
import { ChordWithPlayMetadata } from "@/app/engine/eventBus";
import { IdGenerator } from "@/app/engine/eventIdGenerator";
import { AvlTree } from "@datastructures-js/binary-search-tree";

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
  // in clock ticks. Events without it last one beat
  duration?: number;
};

export const getChordOrNoteText = (event: ChordOrNote) =>
  event.note?.note
    ? serializeOctaveNote(event.note?.note)
    : (event.chord?.chord ?? "");

export type EventsForTick = {
  tick: number;
  events: ChordOrNote[];
};

export type EventForTick = {
  tick: number;
  event: ChordOrNote;
};

export class EventsByTick {
  // to find next/prev events for the given ticks. Shares its event arrays with eventsMap
  private eventsTree: AvlTree<EventsForTick>;
  // to find events at a given tick
  private eventsMap: Map<number, ChordOrNote[]>;
  // to find exact the same event
  private eventsById: Map<string, EventForTick>;
  lastTick: number = 0;

  constructor() {
    this.eventsTree = new AvlTree<EventsForTick>((a, b) => a.tick - b.tick, {
      key: "tick",
    });
    this.eventsMap = new Map<number, ChordOrNote[]>();
    this.eventsById = new Map<string, EventForTick>();
  }

  static generateId(value: NoteEvent | ChordWithPlayMetadata): string {
    return IdGenerator.generate(
      "note" in value
        ? `note-t${value.trackNumber}-${value.note.octave}-${getNoteText(
            value.note.note,
          )}-${Date.now()}-`
        : `chord-${value.chord}-`,
    );
  }

  addEventAtTick(
    tick: number,
    value: NoteEvent | ChordWithPlayMetadata,
    duration?: number,
  ): ChordOrNote {
    const id = EventsByTick.generateId(value);
    const chordOrNote: ChordOrNote =
      "note" in value
        ? { id, note: value as NoteEvent }
        : { id, chord: value as ChordWithPlayMetadata };
    if (duration !== undefined) {
      chordOrNote.duration = duration;
    }
    this.insertEvent(tick, chordOrNote);
    return chordOrNote;
  }

  /**
   * Puts an event with a ready id at the tick. An event with the same id is replaced.
   */
  insertEvent(tick: number, event: ChordOrNote): void {
    if (this.eventsById.has(event.id)) {
      this.removeEvent(event.id);
    }

    let events = this.eventsMap.get(tick);
    if (!events) {
      events = [];
      this.eventsMap.set(tick, events);
      this.eventsTree.insert({ tick, events });
    }
    events.push(event);
    this.eventsById.set(event.id, { tick, event });

    if (tick > this.lastTick) {
      this.lastTick = tick;
    }
  }

  /**
   * Gets the events for a given tick (time).
   *
   * @param tick - The tick (time) to get events for
   * @returns An array of ChordOrNote or undefined if the key does not exist
   */
  getEvents(tick: number): ChordOrNote[] | undefined {
    return this.eventsMap.get(tick);
  }

  getEvent(id: string): EventForTick | undefined {
    return this.eventsById.get(id);
  }

  getNextEvents(tick: number): EventsForTick | undefined {
    const nextNode = this.eventsTree.ceilKey(tick + 1);
    if (nextNode) {
      const { tick, events } = nextNode.getValue();
      return { tick, events };
    }
    return undefined;
  }

  getPreviousEvents(tick: number): EventsForTick | undefined {
    const prevNode = this.eventsTree.floorKey(tick - 1);
    if (prevNode) {
      const { tick, events } = prevNode.getValue();
      return { tick, events };
    }
    return undefined;
  }

  removeEvent(id: string): boolean {
    const eventInfo = this.eventsById.get(id);
    if (!eventInfo) return false;

    const { tick } = eventInfo;
    this.eventsById.delete(id);

    const events = this.eventsMap.get(tick);
    if (events) {
      const index = events.findIndex((e) => e.id === id);
      if (index !== -1) {
        events.splice(index, 1);
      }
      if (events.length === 0) {
        this.eventsMap.delete(tick);
        this.eventsTree.remove({ tick, events: [] });
      }
    }

    if (tick === this.lastTick && !this.eventsMap.has(tick)) {
      const lastNode = this.eventsTree.max();
      this.lastTick = lastNode ? lastNode.getValue().tick : 0;
    }

    return true;
  }

  /**
   * Get the iterable collection of all events in sorted order.
   */
  get items(): EventsForTick[] {
    const result: EventsForTick[] = [];
    this.eventsTree.traverseInOrder((node) => {
      const { tick, events } = node.getValue();
      if (events.length > 0) {
        result.push({ tick, events: [...events] });
      }
    });
    return result;
  }

  /**
   * All events with their ticks in time order
   */
  get flatItems(): EventForTick[] {
    return this.items.flatMap(({ tick, events }) =>
      events.map((event) => ({ tick, event })),
    );
  }

  /**
   *Checks if there are items
   */
  get hasItems(): boolean {
    return this.eventsMap.size > 0;
  }

  get size(): number {
    return this.eventsById.size;
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
      other.eventsById.forEach(({ tick, event }) => {
        merged.insertEvent(tick, event);
      });
      if (other.lastTick > merged.lastTick) {
        merged.lastTick = other.lastTick;
      }
    }
    return merged;
  }
}
