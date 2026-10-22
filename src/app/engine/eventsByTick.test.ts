import { ChordOrNote, EventsByTick } from "./eventsByTick";

let nextId = 0;
jest.mock("@/app/engine/eventIdGenerator", () => ({
  IdGenerator: { generate: (prefix = "") => `${prefix}${nextId++}` },
}));
jest.mock("@/app/engine/eventBus", () => ({}));

const note = (id: string): ChordOrNote => ({
  id,
  note: {
    note: { octave: 4, note: 0, string: 1, fret: 1 },
    trackNumber: 0,
  },
});

describe("EventsByTick", () => {
  it("keeps the tree and the tick lookup in step", () => {
    const data = new EventsByTick();
    data.insertEvent(10, note("a"));
    data.insertEvent(10, note("b"));
    data.insertEvent(30, note("c"));

    data.removeEvent("a");
    expect(data.getEvents(10)?.map((e) => e.id)).toEqual(["b"]);
    expect(data.getNextEvents(0)?.events.map((e) => e.id)).toEqual(["b"]);

    data.removeEvent("b");
    expect(data.getEvents(10)).toBeUndefined();
    expect(data.getNextEvents(0)?.tick).toBe(30);
    expect(data.items.map((i) => i.tick)).toEqual([30]);
  });

  it("drops lastTick to the previous event when the last one goes", () => {
    const data = new EventsByTick();
    data.insertEvent(10, note("a"));
    data.insertEvent(30, note("b"));
    data.removeEvent("b");
    expect(data.lastTick).toBe(10);
  });

  it("replaces an event with the same id", () => {
    const data = new EventsByTick();
    data.insertEvent(10, note("a"));
    data.insertEvent(20, note("a"));
    expect(data.size).toBe(1);
    expect(data.getEvent("a")?.tick).toBe(20);
    expect(data.getEvents(10)).toBeUndefined();
  });

  it("merges tracks", () => {
    const first = new EventsByTick();
    first.insertEvent(10, note("a"));
    const second = new EventsByTick();
    second.insertEvent(10, note("b"));
    second.insertEvent(40, note("c"));
    const merged = EventsByTick.merge(first, second);
    expect(merged.getEvents(10)?.map((e) => e.id)).toEqual(["a", "b"]);
    expect(merged.lastTick).toBe(40);
  });
});
