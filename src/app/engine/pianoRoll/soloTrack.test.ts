import { ChordOrNote, EventsByTick } from "@/app/engine/eventsByTick";
import { getAudibleEvents, getSoloTrack, setSoloTrack } from "./soloTrack";

jest.mock("@/app/engine/eventBus", () => ({ DEFAULT_CHORD_TRACK_NUMBER: 1 }));
jest.mock("@/app/engine/eventIdGenerator", () => ({
  IdGenerator: { generate: (prefix = "") => prefix },
}));

const note = (id: string, trackNumber: number): ChordOrNote => ({
  id,
  note: { note: { octave: 3, note: 0, string: 1, fret: 1 }, trackNumber },
});

describe("solo track", () => {
  const events = [note("a", 0), note("b", 2)];

  it("plays every track while no track is solo", () => {
    expect(getAudibleEvents(new EventsByTick(), events)).toBe(events);
  });

  it("plays only the solo track of its melody", () => {
    const data = new EventsByTick();
    setSoloTrack(data, 2);
    expect(getAudibleEvents(data, events)).toEqual([events[1]]);
    expect(getAudibleEvents(new EventsByTick(), events)).toBe(events);
    setSoloTrack(data, undefined);
    expect(getSoloTrack(data)).toBeUndefined();
  });

  it("keeps the solo of another melody when this one clears", () => {
    const data = new EventsByTick();
    const other = new EventsByTick();
    setSoloTrack(data, 0);
    setSoloTrack(other, undefined);
    expect(getSoloTrack(data)).toBe(0);
    setSoloTrack(data, undefined);
  });
});
