import { Instrument } from "@/app/data/instruments";
import { StringOctaveNote } from "@/app/data/notes";
import { ChordWithPlayMetadata } from "@/app/engine/eventBus";

export type NoteEvent = {
  note: StringOctaveNote;
  trackNumber: number;
  instrument?: Instrument;
  velocity?: number;
  looperChannel?: number;
};

export type ChordOrNote = {
  note?: NoteEvent;
  chord?: ChordWithPlayMetadata;
};

export class EventsByTick {
  private events: Map<number, ChordOrNote[]>;

  constructor() {
    this.events = new Map<number, ChordOrNote[]>();
  }

  /**
   * Adds or updates a value in the array for the given key.
   * If the key exists, the value is appended to the array.
   * If the key does not exist, a new array is created with the value.
   *
   * @param tick - The tick (time) at which the event occurs
   * @param value - The NoteEvent or ChordWithPlayMetadata to add or update
   */
  addOrUpdateEvent(
    tick: number,
    value: NoteEvent | ChordWithPlayMetadata
  ): void {
    let chordOrNote: ChordOrNote;

    if ("note" in value) {
      chordOrNote = { note: value as NoteEvent };
    } else {
      chordOrNote = { chord: value as ChordWithPlayMetadata };
    }

    if (this.events.has(tick)) {
      this.events.get(tick)?.push(chordOrNote);
    } else {
      this.events.set(tick, [chordOrNote]);
    }
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
      other.events.forEach((value, key) => {
        if (merged.events.has(key)) {
          merged.events.get(key)?.push(...value);
        } else {
          merged.events.set(key, [...value]);
        }
      });
    }
    return merged;
  }
}
