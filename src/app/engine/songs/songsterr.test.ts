import { CHROMATIC, scalesMap } from "@/app/data/scaleDefinitions";
import {
  SongsterrMeasure,
  SongsterrMeta,
  SongsterrTrack,
  convertSongsterr,
  findSection,
  listScales,
  listSections,
} from "@/app/engine/songs/songsterr";

const STANDARD = [64, 59, 55, 50, 45, 40];

// An A minor arpeggio: A2, E3, A3, C4.
const arpeggio = (marker?: string): SongsterrMeasure => ({
  marker: marker === undefined ? undefined : { text: marker },
  voices: [
    {
      beats: [
        [4, 0],
        [3, 2],
        [2, 2],
        [1, 1],
      ].map(([string, fret]) => ({
        duration: [1, 4],
        notes: [{ string, fret }],
      })),
    },
  ],
});

const rest: SongsterrMeasure = {
  voices: [
    {
      beats: [
        { duration: [1, 1], notes: [{ string: 0, fret: 0, rest: true }] },
      ],
    },
  ],
};

const track: SongsterrTrack = {
  tuning: STANDARD,
  measures: [arpeggio("Intro"), rest, arpeggio("Verse")],
};

const meta: SongsterrMeta = {
  songId: 1,
  revisionId: 1,
  image: "x",
  artist: "Band",
  title: "Song",
  tracks: [{ instrument: "Guitar", name: "Lead" }],
};

describe("listSections", () => {
  it("runs each section up to the next marker", () => {
    expect(listSections(track.measures)).toEqual([
      { name: "Intro", from: 0, to: 1 },
      { name: "Verse", from: 2, to: 2 },
    ]);
  });

  it("finds a section by part of its name", () => {
    expect(findSection(track.measures, "ver")?.from).toBe(2);
  });
});

describe("convertSongsterr", () => {
  const scales = listScales(scalesMap, CHROMATIC);

  it("moves the song to an E tonic", () => {
    const result = convertSongsterr({
      meta,
      melodyTrack: track,
      from: 0,
      to: 2,
      scales,
    });
    expect(result.tonic).toBe(9);
    expect(result.shift).toBe(-5);
    expect(result.song.root).toBe(4);
    expect(result.song.tracks[0].tabNotes).toHaveLength(8);
    expect(result.song.tracks[0].tabNotes[0]).toEqual({
      tick: 0,
      string: 5,
      fret: 0,
    });
  });

  it("starts the measures at tick 0 with 16 ticks a quarter note", () => {
    const result = convertSongsterr({
      meta,
      melodyTrack: track,
      from: 2,
      to: 2,
      scales,
      title: "Song (Verse)",
    });
    expect(result.song.title).toBe("Song (Verse)");
    expect(result.song.tracks[0].tabNotes.map((n) => n.tick)).toEqual([
      0, 16, 32, 48,
    ]);
  });

  it("rejects measures without notes", () => {
    expect(() =>
      convertSongsterr({ meta, melodyTrack: track, from: 1, to: 1, scales }),
    ).toThrow("empty");
  });
});
