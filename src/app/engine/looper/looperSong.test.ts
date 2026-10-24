import { TICKS_IN_BAR as B } from "@/app/data/clockConstants";
import { ChordOrNote, EventsByTick } from "@/app/engine/eventsByTick";
import {
  getEventTrack,
  getTrackInfos,
} from "@/app/engine/pianoRoll/pianoRollTracks";
import { buildLooperSong, getLooperSongLength } from "./looperSong";

jest.mock("@/app/engine/eventBus", () => ({ DEFAULT_CHORD_TRACK_NUMBER: 1 }));
jest.mock("@/app/engine/eventIdGenerator", () => ({
  IdGenerator: { generate: (prefix = "") => prefix },
}));

const note = (id: string, looperChannel: number): ChordOrNote => ({
  id,
  note: {
    note: { octave: 3, note: 0, string: 1, fret: 1 },
    trackNumber: 0,
    looperChannel,
  },
});

const chord = (id: string, looperChannel: number): ChordOrNote => ({
  id,
  chord: { chord: "Am", metadata: { looperChannel } },
});

const loop = (lengthTicks: number, ...events: [number, ChordOrNote][]) => {
  const data = new EventsByTick();
  events.forEach(([tick, event]) => data.insertEvent(tick, event));
  return { events: data, lengthTicks };
};

describe("looper song", () => {
  it("runs to the shortest length every loop fits into a whole number of times", () => {
    expect(getLooperSongLength([2 * B, 3 * B])).toBe(6 * B);
    expect(getLooperSongLength([4 * B, 4 * B])).toBe(4 * B);
  });

  it("stops at the longest loop when the lengths only meet past 32 bars", () => {
    expect(getLooperSongLength([5 * B, 7 * B])).toBe(7 * B);
  });

  it("repeats each channel to the song length on tracks of its own", () => {
    const song = buildLooperSong([
      { channel: 0, loop: loop(B, [1, note("a", 0)]) },
      { channel: 1, loop: loop(2 * B, [1, note("b", 1)], [B, chord("c", 1)]) },
    ]);

    const events = song.flatItems.map(({ tick, event }) => [
      event.id,
      tick,
      getEventTrack(event),
    ]);
    expect(events).toEqual([
      ["a-0", 1, 0],
      ["b-0", 1, 1],
      ["c-0", B, 2],
      [`a-${B}`, B + 1, 0],
    ]);
    expect(
      song.flatItems.every(
        ({ event }) =>
          event.note?.looperChannel === undefined &&
          event.chord?.metadata.looperChannel === undefined,
      ),
    ).toBe(true);
    expect([...getTrackInfos(song).values()].map(({ name }) => name)).toEqual([
      "Loop 1",
      "Loop 2",
      "Chords, loop 2",
    ]);
  });
});
