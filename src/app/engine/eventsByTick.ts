import { getChordName } from "@/app/data/chordModes";
import { Instrument } from "@/app/data/instruments";
import {
  getNoteText,
  OctaveNote,
  serializeOctaveNote,
  StringOctaveNote,
} from "@/app/data/notes";
import { getModesForNote } from "@/app/engine/chords/chordModesByNote";
import { ChordWithPlayMetadata } from "@/app/engine/eventBus";
import { IdGenerator } from "@/app/engine/eventIdGenerator";
import { octaveNoteToStringOctaveNoteMap } from "@/app/engine/generateNeckRepresentation";
import { playChordOrNote } from "@/app/engine/playerHelper";
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

export const getChordOrNoteText = (event: ChordOrNote) =>
  event.note?.note
    ? serializeOctaveNote(event.note?.note)
    : event.chord?.chord ?? "";

type EventsForTick = {
  tick: number;
  events: ChordOrNote[];
};

type EventForTick = {
  tick: number;
  event: ChordOrNote;
};

export class EventsByTick {
  // to find next/prev events for the given ticks
  private eventsTree: AvlTree<EventsForTick>;
  // to find events at a given tick
  private eventsMap: Map<number, ChordOrNote[]>;
  // to find exact the same event
  private eventsById: Map<string, EventForTick>;
  lastTick: number = 0;

  constructor() {
    this.eventsTree = new AvlTree<{ tick: number; events: ChordOrNote[] }>(
      (a, b) => a.tick - b.tick,
      { key: "tick" }
    );
    this.eventsMap = new Map<number, ChordOrNote[]>();
    this.eventsById = new Map<string, EventForTick>();
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

  changeEvent(
    eventId: string,
    updatedNote: OctaveNote,
    newTick: number
  ): boolean {
    const eventInfo = this.eventsById.get(eventId);
    if (!eventInfo) {
      return false;
    }

    const { event, tick: oldTick } = eventInfo;

    // Change pitch
    const pitchUpdated = this.updatePitch(event, updatedNote);

    const positionUpdate = newTick !== oldTick;
    // Change position
    if (positionUpdate) {
      // Remove from old position
      this.changePosition(oldTick, eventId, newTick, event);
    }

    if (newTick > this.lastTick) {
      this.lastTick = newTick;
    }

    if (pitchUpdated) {
      playChordOrNote(event);
    }

    return positionUpdate || pitchUpdated;
  }

  private updatePitch(event: ChordOrNote, updatedNote: OctaveNote): boolean {
    const serializedUpdatedNote = serializeOctaveNote(updatedNote);
    const eventNote = event.note?.note ?? event.chord?.metadata.octaveNote;
    if (!eventNote) {
      return false;
    }
    const serializedEventNote = serializeOctaveNote(eventNote);

    if (serializedEventNote === serializedUpdatedNote) {
      return false;
    }

    const noteEvent = event.note;
    const chordData = event.chord;
    if (noteEvent) {
      const serializedOctaveNote = serializeOctaveNote(updatedNote);
      const stringOctaveNotes =
        octaveNoteToStringOctaveNoteMap.get(serializedOctaveNote);
      if (stringOctaveNotes !== undefined && stringOctaveNotes.length > 0) {
        noteEvent.note = stringOctaveNotes[0];
        return true;
      }
      console.warn(
        "No notes on guitar neck available for the new pitch %s",
        updatedNote
      );
      return false;
    } else if (chordData) {
      const metadata = chordData.metadata;
      const currentChordMode = metadata.chordMode;
      const modesForNewNote = getModesForNote(updatedNote.note);
      if (modesForNewNote && modesForNewNote.size > 0) {
        const newChordMode =
          currentChordMode && modesForNewNote.has(currentChordMode)
            ? currentChordMode
            : modesForNewNote.values().next().value!; // get the first available mode
        chordData.chord = getChordName(updatedNote.note, newChordMode);
        metadata.chordMode = newChordMode;
        metadata.octaveNote = updatedNote;
        return true;
      } else {
        console.warn(
          "Cannot move chord to note %s: no available chord modes",
          updatedNote
        );
        return false;
      }
    }
    return false;
  }

  private changePosition(
    oldTick: number,
    eventId: string,
    newTick: number,
    event: ChordOrNote
  ) {
    const oldEvents = this.eventsMap.get(oldTick);
    if (oldEvents) {
      const index = oldEvents.findIndex((e) => e.id === eventId);
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
      const existingEvents = this.eventsMap.get(newTick)!;
      if (!existingEvents.some((e) => e.id === eventId)) {
        existingEvents.push(event);
        const node = this.eventsTree.findKey(newTick);
        if (node) {
          node.getValue().events = existingEvents;
        }
      }
    } else {
      this.eventsMap.set(newTick, [event]);
      this.eventsTree.insert({ tick: newTick, events: [event] });
    }

    // Update eventsById
    this.eventsById.set(eventId, { tick: newTick, event });
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
  get items(): EventsForTick[] {
    const result: { tick: number; events: ChordOrNote[] }[] = [];
    this.eventsTree.traverseInOrder((node) => {
      const { tick, events } = node.getValue();
      if (events.length > 0) {
        result.push({ tick, events });
      }
    });
    return result;
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
