import { ChordOrNote, EventsByTick } from "@/app/engine/eventsByTick";
import { getEditHistory } from "./editHistory";
import { getEventTrack, getTrackInfos } from "./pianoRollTracks";
import { addRecordedTracks } from "./recordedTracks";

jest.mock("@/app/engine/eventBus", () => ({ DEFAULT_CHORD_TRACK_NUMBER: 1 }));
jest.mock("@/app/engine/eventIdGenerator", () => ({
  IdGenerator: { generate: (prefix = "") => prefix },
}));

const note = (id: string, trackNumber: number): ChordOrNote => ({
  id,
  note: {
    note: { octave: 3, note: 0, string: 1, fret: 1 },
    trackNumber,
    instrument: "electric_guitar_clean",
  },
});

const chord = (id: string): ChordOrNote => ({
  id,
  chord: { chord: "Am", metadata: {} },
});

const melody = (...events: [number, ChordOrNote][]) => {
  const data = new EventsByTick();
  events.forEach(([tick, event]) => data.insertEvent(tick, event));
  return data;
};

describe("addRecordedTracks", () => {
  it("puts the notes and the chords of a take on new tracks after the song", () => {
    const song = melody([0, note("song-a", 0)], [4, note("song-b", 2)]);
    const take = melody([8, note("take-a", 0)], [8, chord("take-b")]);

    expect(addRecordedTracks(song, take)).toBe(true);

    const tracks = song.flatItems.map(({ tick, event }) => [
      event.id,
      tick,
      getEventTrack(event),
    ]);
    expect(tracks).toEqual([
      ["song-a", 0, 0],
      ["song-b", 4, 2],
      ["take-a", 8, 3],
      ["take-b", 8, 4],
    ]);
    expect(getTrackInfos(song).get(3)?.name).toBe("Take 1");
    expect(getTrackInfos(song).get(4)?.name).toBe("Chords, take 1");
  });

  it("numbers the next take and leaves an undo step", () => {
    const song = melody([0, note("song-a", 0)]);
    addRecordedTracks(song, melody([1, note("take-a", 0)]));
    addRecordedTracks(song, melody([2, note("take-b", 0)]));

    expect(getTrackInfos(song).get(2)?.name).toBe("Take 2");
    getEditHistory(song).undo();
    expect(song.getEvent("take-b")).toBeUndefined();
    expect(song.getEvent("take-a")).toBeDefined();
  });

  it("leaves the song as it was for an empty take", () => {
    const song = melody([0, note("song-a", 0)]);

    expect(addRecordedTracks(song, new EventsByTick())).toBe(false);
    expect(getTrackInfos(song).size).toBe(0);
  });
});
