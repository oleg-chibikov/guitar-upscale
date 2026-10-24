import { CHROMATIC, scalesMap } from "@/app/data/scaleDefinitions";
import {
  SongsterrMeasure,
  SongsterrMeta,
  SongsterrTrack,
  convertSongsterr,
  findSection,
  listExtraTrackIndexes,
  listScales,
  listSections,
  songsterrTrackName,
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

  it("adds extra tracks with their own instruments and names", () => {
    const result = convertSongsterr({
      meta,
      melodyTrack: track,
      extraTracks: [
        { track, name: "Violin", instrument: "violin" },
        { track, name: "Violin", instrument: "violin" },
        { track: { ...track, measures: [rest, rest, rest] }, name: "Flute" },
      ],
      from: 0,
      to: 2,
      scales,
    });
    const extras = result.song.tracks.slice(1);
    expect(extras.map((t) => [t.name, t.instrument])).toEqual([
      ["Violin", "violin"],
      ["Violin 2", "violin"],
      ["Chords", undefined],
    ]);
    expect(extras[0].tabNotes).toEqual(result.song.tracks[0].tabNotes);
  });

  it("gives notes struck together different strings", () => {
    const chord: SongsterrTrack = {
      tuning: STANDARD,
      measures: [
        {
          voices: [
            {
              beats: [
                {
                  duration: [1, 1],
                  notes: [
                    { string: 4, fret: 0 },
                    { string: 4, fret: 7 },
                    { string: 3, fret: 2 },
                  ],
                },
              ],
            },
          ],
        },
      ],
    };
    const result = convertSongsterr({
      meta,
      melodyTrack: chord,
      from: 0,
      to: 0,
      scales,
    });
    const strings = result.song.tracks[0].tabNotes.map((n) => n.string);
    expect(new Set(strings).size).toBe(strings.length);
  });
});

describe("listExtraTrackIndexes", () => {
  it("leaves out drums and empty tracks", () => {
    expect(
      listExtraTrackIndexes({
        ...meta,
        tracks: [
          { instrumentId: 30, instrument: "Distortion Guitar", name: "" },
          { instrumentId: 1024, instrument: "Drums", name: "Drummer" },
          { instrumentId: 73, instrument: "Flute", name: "", isEmpty: true },
          { instrumentId: 33, instrument: "Electric Bass (finger)", name: "" },
        ],
      }),
    ).toEqual([0, 3]);
  });
});

describe("songsterrTrackName", () => {
  it("keeps a name from turning the track into the melody or chords", () => {
    expect(songsterrTrackName({ instrument: "Flute", name: "" })).toBe("Flute");
    expect(songsterrTrackName({ instrument: "Piano", name: "Chords" })).toBe(
      "Piano Chords",
    );
  });
});
