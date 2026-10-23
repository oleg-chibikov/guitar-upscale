import { ChordOrNote, EventsByTick } from "@/app/engine/eventsByTick";
import {
  addTrackInfo,
  getEventTrack,
  getTrackInfos,
  listTracks,
  removeTrackInfo,
  renameTrackInfo,
  withTrack,
} from "./pianoRollTracks";

jest.mock("@/app/engine/eventBus", () => ({ DEFAULT_CHORD_TRACK_NUMBER: 1 }));
jest.mock("@/app/engine/eventIdGenerator", () => ({
  IdGenerator: { generate: (prefix = "") => prefix },
}));

const note = (id: string, trackNumber: number): ChordOrNote => ({
  id,
  note: {
    note: { octave: 3, note: 0, string: 1, fret: 1 },
    trackNumber,
    instrument: trackNumber === 3 ? "overdriven_guitar" : undefined,
  },
});

const chord = (id: string, trackNumber?: number): ChordOrNote => ({
  id,
  chord: { chord: "Am", metadata: { trackNumber } },
});

describe("piano roll tracks", () => {
  it("names tracks after the song, then the instrument, then the number", () => {
    const events = [
      { tick: 0, event: note("a", 0) },
      { tick: 0, event: note("b", 3) },
      { tick: 0, event: note("c", 5) },
    ];
    const tracks = listTracks(
      events,
      new Map([
        [0, { name: "Lead" }],
        [1, { name: "Rhythm", instrument: "distortion_guitar" as const }],
      ])
    );
    expect(tracks.map(({ trackNumber, label }) => [trackNumber, label])).toEqual([
      [0, "Lead"],
      [1, "Rhythm"],
      [3, "Overdriven Guitar"],
      [5, "Track 6"],
    ]);
    // a song track with no notes left still takes new notes with its instrument
    expect(tracks[1].instrument).toBe("distortion_guitar");
  });

  it("puts a chord with no track in the chords track", () => {
    expect(getEventTrack(chord("a"))).toBe(1);
    expect(getEventTrack(chord("b", 4))).toBe(4);
  });

  it("moves a note and a chord to another track", () => {
    const track = { trackNumber: 2, label: "Vocals", instrument: "voice_oohs" as const };
    expect(withTrack(note("a", 0), track).note).toMatchObject({
      trackNumber: 2,
      instrument: "voice_oohs",
    });
    expect(withTrack(chord("b", 1), track).chord?.metadata).toMatchObject({
      trackNumber: 2,
      trackInstrument: "voice_oohs",
    });
  });

  it("adds, renames and removes tracks", () => {
    const data = new EventsByTick();
    const events = [{ tick: 0, event: note("a", 3) }];
    const added = addTrackInfo(data, listTracks(events, getTrackInfos(data)));
    expect(added).toBe(4);

    const tracks = () => listTracks(events, getTrackInfos(data));
    renameTrackInfo(data, tracks()[0], " Solo ");
    expect(tracks().map(({ label }) => label)).toEqual(["Solo", "Track 5"]);
    // the renamed track keeps the instrument its notes play with
    expect(tracks()[0].instrument).toBe("overdriven_guitar");

    removeTrackInfo(data, tracks()[1]);
    expect(tracks().map(({ label }) => label)).toEqual(["Solo"]);
    // a removed track with notes left, after an undo, shows with its name
    removeTrackInfo(data, tracks()[0]);
    expect(tracks().map(({ label }) => label)).toEqual(["Solo"]);
    expect(listTracks([], getTrackInfos(data))).toEqual([]);
    // the next track doesn't take the number of a removed one
    expect(addTrackInfo(data, [])).toBe(5);
  });
});
