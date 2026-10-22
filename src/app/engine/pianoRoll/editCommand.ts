import { EventForTick, EventsByTick } from "@/app/engine/eventsByTick";

// null means the event doesn't exist on that side of the change
export type EventState = EventForTick | null;

export type EventChange = {
  id: string;
  before: EventState;
  after: EventState;
};

export type EditCommand = {
  label: string;
  changes: EventChange[];
};

export type Direction = "forward" | "backward";

export const applyCommand = (
  data: EventsByTick,
  command: EditCommand,
  direction: Direction
) => {
  const from = direction === "forward" ? "before" : "after";
  const to = direction === "forward" ? "after" : "before";
  // remove first, so an event moving onto a tick taken by another changed event lands cleanly
  for (const change of command.changes) {
    if (change[from]) {
      data.removeEvent(change.id);
    }
  }
  for (const change of command.changes) {
    const state = change[to];
    if (state) {
      data.insertEvent(state.tick, state.event);
    }
  }
};

const isSameState = (a: EventState, b: EventState) =>
  a === b || (a !== null && b !== null && a.tick === b.tick && a.event === b.event);

export class CommandBuilder {
  private changes = new Map<string, EventChange>();

  constructor(private data: EventsByTick, private label: string) {}

  set(id: string, after: EventState): this {
    const existing = this.changes.get(id);
    if (existing) {
      existing.after = after;
    } else {
      this.changes.set(id, { id, before: this.data.getEvent(id) ?? null, after });
    }
    return this;
  }

  build(): EditCommand | undefined {
    const changes = Array.from(this.changes.values()).filter(
      (change) => !isSameState(change.before, change.after)
    );
    return changes.length ? { label: this.label, changes } : undefined;
  }
}
