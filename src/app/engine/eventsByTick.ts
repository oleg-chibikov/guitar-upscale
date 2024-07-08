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
};
export class EventsByTick {
  // to find next/prev events for the given ticks
  private eventsTree: AvlTree<{ tick: number; events: ChordOrNote[] }>;
  // to find events at a given tick
  private eventsMap: Map<number, ChordOrNote[]>;
  // to find exact the same event
  private eventsById: Map<string, { tick: number; event: ChordOrNote }>;
  lastTick: number = 0;

  constructor() {
    this.eventsTree = new AvlTree<{ tick: number; events: ChordOrNote[] }>(
      (a, b) => a.tick - b.tick,
      { key: "tick" }
    );
    this.eventsMap = new Map<number, ChordOrNote[]>();
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

    // Update AVL Tree
    const existingNode = this.eventsTree.findKey(tick);
    if (existingNode) {
      existingNode.getValue().events.push(chordOrNote);
    } else {
      this.eventsTree.insert({ tick, events: [chordOrNote] });
    }

    // Update Map
    if (this.eventsMap.has(tick)) {
      this.eventsMap.get(tick)!.push(chordOrNote);
    } else {
      this.eventsMap.set(tick, [chordOrNote]);
    }

    this.eventsById.set(id, { tick, event: chordOrNote });

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

  getNextEvents(
    tick: number
  ): { tick: number; events: ChordOrNote[] } | undefined {
    const nextNode = this.eventsTree.ceilKey(tick + 1);
    if (nextNode) {
      const { tick, events } = nextNode.getValue();
      return { tick, events };
    }
    return undefined;
  }

  getPreviousEvents(
    tick: number
  ): { tick: number; events: ChordOrNote[] } | undefined {
    const prevNode = this.eventsTree.floorKey(tick - 1);
    if (prevNode) {
      const { tick, events } = prevNode.getValue();
      return { tick, events };
    }
    return undefined;
  }

  changeEvent(id: string, newPitch: OctaveNote, newTick: number): boolean {
    const eventInfo = this.eventsById.get(id);
    if (!eventInfo) {
      return false;
    }

    const { event, tick: oldTick } = eventInfo;

    // Change pitch
    if (event.note) {
      const serializedOctaveNote = serializeOctaveNote(newPitch);
      const stringOctaveNotes =
        octaveNoteToStringOctaveNoteMap.get(serializedOctaveNote);
      if (stringOctaveNotes !== undefined && stringOctaveNotes.length > 0) {
        event.note.note = stringOctaveNotes[0];
      }
    } else if (event.chord) {
      event.chord.chord = event.chord.chord.replace(
        /^[A-G#b]+/,
        getNoteText(newPitch.note)
      );
    }

    // Change position
    if (newTick !== oldTick) {
      // Remove from old position
      const oldEvents = this.eventsMap.get(oldTick);
      if (oldEvents) {
        const index = oldEvents.findIndex((e) => e.id === id);
        if (index !== -1) {
          oldEvents.splice(index, 1);
          if (oldEvents.length === 0) {
            this.eventsMap.delete(oldTick);
            this.eventsTree.remove({ tick: oldTick, events: [] });
          } else {
            this.eventsTree.remove({ tick: oldTick, events: [] });
            this.eventsTree.insert({ tick: oldTick, events: oldEvents });
          }
        }
      }

      // Add to new position
      if (this.eventsMap.has(newTick)) {
        this.eventsMap.get(newTick)!.push(event);
        const node = this.eventsTree.findKey(newTick);
        if (node) {
          node.getValue().events.push(event);
        }
      } else {
        this.eventsMap.set(newTick, [event]);
        this.eventsTree.insert({ tick: newTick, events: [event] });
      }

      // Update eventsById
      this.eventsById.set(id, { tick: newTick, event });
    }

    if (newTick > this.lastTick) {
      this.lastTick = newTick;
    }

    return true;
  }

  removeEvent(id: string): boolean {
    const eventInfo = this.eventsById.get(id);
    if (!eventInfo) return false;

    const { tick } = eventInfo;

    // Remove from Map
    const events = this.eventsMap.get(tick);
    if (events) {
      const index = events.findIndex((e) => e.id === id);
      if (index !== -1) {
        events.splice(index, 1);
        if (events.length === 0) {
          this.eventsMap.delete(tick);
        }
      }
    }

    // Remove from AVL Tree
    const node = this.eventsTree.findKey(tick);
    if (node) {
      const treeEvents = node.getValue().events;
      const index = treeEvents.findIndex((e) => e.id === id);
      if (index !== -1) {
        treeEvents.splice(index, 1);
        if (treeEvents.length === 0) {
          this.eventsTree.remove({ tick, events: [] });
        }
      }
    }

    // Remove from eventsById
    this.eventsById.delete(id);

    if (tick === this.lastTick) {
      const lastNode = this.eventsTree.max();
      this.lastTick = lastNode ? lastNode.getValue().tick : 0;
    }

    return true;
  }

  /**
   * Get the iterable collection of all events in sorted order.
   */
  get items() {
    return Array.from(this.eventsMap.entries())
      .sort((a, b) => a[0] - b[0])
      .map(([tick, events]) => ({ tick, events }))
      .filter((x) => x.events.length > 0);
  }

  /**
   *Checks if there are items
   */
  get hasItems(): boolean {
    return this.eventsMap.size > 0;
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
      other.eventsMap.forEach((events, tick) => {
        // merge map
        if (merged.eventsMap.has(tick)) {
          merged.eventsMap.get(tick)!.push(...events);
        } else {
          merged.eventsMap.set(tick, [...events]);
        }

        // merge AvlTree
        const node = merged.eventsTree.findKey(tick);
        if (node) {
          node.getValue().events.push(...events);
        } else {
          merged.eventsTree.insert({ tick, events: [...events] });
        }
      });

      // Merge eventsById
      other.eventsById.forEach((value, key) => {
        merged.eventsById.set(key, { ...value });
      });

      if (other.lastTick > merged.lastTick) {
        merged.lastTick = other.lastTick;
      }
    }
    return merged;
  }
}
