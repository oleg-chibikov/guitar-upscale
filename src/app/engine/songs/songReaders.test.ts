import { Note } from "@/app/data/notes";
import { Song } from "@/app/data/song";
import fs from "fs";
import { AnyEvent, write } from "midifile-ts";
import { matchChordMode } from "./chordNameMatcher";
import { readGuitarProSong } from "./gpReader";
import { writeGuitarPro } from "./gpWriter";
import { readMidiSong } from "./midiReader";
import { midiToOctaveNote, normalizeChordName } from "./songHelpers";

const NUMB = "public/songs/Linkin Park - Numb.gp";

describe("readGuitarProSong", () => {
  it("keeps chords on the Chords track and the melody as tab", async () => {
    const song = await readGuitarProSong(
      new Uint8Array(fs.readFileSync(NUMB)),
      "Linkin Park - Numb.gp"
    );

    expect(song.band).toBe("Linkin Park");
    expect(song.title).toBe("Numb");
    expect(song.tempo).toBe(110);
    expect(song.pickupTicks).toBe(24);
    expect(song.tracks.map((track) => track.name)).toEqual([
      "Melody",
      "Chords",
      "Acoustic Guitar Nylon",
    ]);

    const [melody, chords, guitar] = song.tracks;
    expect(melody.instrument).toBeUndefined();
    expect(melody.chords).toEqual([]);
    expect(melody.tabNotes.slice(0, 2)).toEqual([
      expect.objectContaining({ tick: 0, string: 1, fret: 0 }),
      expect.objectContaining({ tick: 8, string: 1, fret: 3 }),
    ]);

    expect(chords.tabNotes).toEqual([]);
    expect(chords.chords.slice(0, 4).map((chord) => chord.name)).toEqual([
      "Em",
      "C",
      "G",
      "D",
    ]);

    expect(guitar.instrument).toBe("acoustic_guitar_nylon");
    expect(guitar.tabNotes.length).toBeGreaterThan(0);
  });
});

const note = (
  deltaTime: number,
  noteNumber: number,
  on: boolean,
  channel = 0
): AnyEvent => ({
  type: "channel",
  subtype: on ? "noteOn" : "noteOff",
  deltaTime,
  channel,
  noteNumber,
  velocity: on ? 100 : 0,
});

const triad = (notes: number[], channel: number): AnyEvent[] => [
  ...notes.map((n) => note(0, n, true, channel)),
  ...notes.map((n, i) => note(i === 0 ? 480 : 0, n, false, channel)),
];

describe("readMidiSong", () => {
  const melody: AnyEvent[] = [
    { type: "meta", subtype: "trackName", deltaTime: 0, text: "Lead" },
    {
      type: "channel",
      subtype: "programChange",
      deltaTime: 0,
      channel: 0,
      value: 30,
    },
    // three notes at once on a melody track stay notes
    ...triad([64, 67, 71], 0),
  ];
  const chords: AnyEvent[] = [
    { type: "meta", subtype: "trackName", deltaTime: 0, text: "Chords" },
    { type: "meta", subtype: "marker", deltaTime: 0, text: "Bbm" },
    ...triad([58, 61, 65], 1),
    ...triad([60, 64, 67], 1),
  ];
  const bytes = write([melody, chords], 480);
  const song = readMidiSong(bytes, "Band - Title.mid");

  it("reads the band and the title from the file name", () => {
    expect(song.band).toBe("Band");
    expect(song.title).toBe("Title");
    expect(song.root).toBe(Note.E);
  });

  it("plays other tracks as notes only", () => {
    const lead = song.tracks.find((track) => track.name === "Lead");
    expect(lead?.instrument).toBe("distortion_guitar");
    expect(lead?.chords).toEqual([]);
    expect(lead?.pitchNotes).toHaveLength(3);
  });

  it("plays the Chords track as chords, named by markers or by notes", () => {
    const track = song.tracks.find((t) => t.name === "Chords");
    expect(track?.pitchNotes).toEqual([]);
    expect(track?.chords).toEqual([
      { tick: 0, name: "A#m" },
      {
        tick: 16,
        notes: [
          { octave: 5, note: Note.C },
          { octave: 5, note: Note.E },
          { octave: 5, note: Note.G },
        ],
      },
    ]);
  });
});

describe("normalizeChordName", () => {
  it.each([
    ["Em", "Em"],
    ["Bb7", "A#7"],
    ["F#dim", "F#dim"],
    ["C/G", "C"],
    ["Verse", undefined],
    ["hello", undefined],
  ])("%s gives %s", (text, expected) => {
    expect(normalizeChordName(text)).toBe(expected);
  });
});

describe("matchChordMode", () => {
  const notes = (...values: number[]) =>
    values.map((midi) => ({ octave: Math.floor(midi / 12), note: midi % 12 }));

  it.each([
    [notes(67, 62, 59, 55), "G"],
    [notes(69, 66, 62), "D"],
    [notes(64, 60, 57), "Am"],
    [notes(64, 59, 55, 52), "Em"],
  ])("names %j as %s", (sortedNotes, expected) => {
    expect(matchChordMode(sortedNotes)).toBe(expected);
  });

  it("leaves unknown note sets to the detector", () => {
    expect(matchChordMode(notes(61, 60))).toBeUndefined();
  });
});

describe("writeGuitarPro", () => {
  const standard = [64, 59, 55, 50, 45, 40].map(midiToOctaveNote);

  it("keeps notes, lengths, chords and the pickup through a round trip", async () => {
    const song: Song = {
      band: "Band",
      title: "Title",
      tempo: 97,
      root: Note.E,
      pickupTicks: 16,
      tracks: [
        {
          name: "Lead",
          instrument: "distortion_guitar",
          tuning: standard,
          tabNotes: [
            { tick: 0, string: 0, fret: 3, duration: 8 },
            // crosses the bar line at tick 16 and overlaps the next note
            { tick: 8, string: 1, fret: 5, duration: 40 },
            { tick: 16, string: 0, fret: 7, duration: 16 },
          ],
          pitchNotes: [
            { tick: 32, octaveNote: midiToOctaveNote(52), duration: 4 },
          ],
          chords: [
            { tick: 16, name: "Em", frets: [0, 0, 0, 2, 2, 0] },
            { tick: 80, name: "C" },
          ],
        },
      ],
    };

    const bytes = await writeGuitarPro(song, { getProgram: () => 30 });
    const back = await readGuitarProSong(bytes, "x.gp");

    expect([back.band, back.title, back.tempo, back.pickupTicks]).toEqual([
      "Band",
      "Title",
      97,
      16,
    ]);
    expect(back.tracks.map((t) => t.name)).toEqual(["Lead", "Chords"]);
    const [lead, chords] = back.tracks;
    expect(lead.instrument).toBe("distortion_guitar");
    const sorted = [...lead.tabNotes].sort(
      (a, b) => a.tick - b.tick || a.string - b.string
    );
    expect(sorted).toEqual([
      { tick: 0, string: 0, fret: 3, duration: 8 },
      { tick: 8, string: 1, fret: 5, duration: 40 },
      { tick: 16, string: 0, fret: 7, duration: 16 },
      { tick: 32, string: 3, fret: 2, duration: 4 },
    ]);
    expect(chords.chords.map((c) => [c.tick, c.name])).toEqual([
      [16, "Em"],
      [80, "C"],
    ]);
  });

  it("keeps the note volume as dynamics", async () => {
    const song: Song = {
      band: "Band",
      title: "Title",
      root: Note.E,
      tracks: [
        {
          name: "Lead",
          tuning: standard,
          tabNotes: [
            { tick: 0, string: 0, fret: 3, duration: 8, velocity: 64 },
            // a quieter note on the same beat gets its own beat
            { tick: 0, string: 1, fret: 3, duration: 8, velocity: 21 },
            { tick: 8, string: 0, fret: 5, duration: 8 },
          ],
          pitchNotes: [],
          chords: [],
        },
      ],
    };

    const back = await readGuitarProSong(await writeGuitarPro(song), "x.gp");
    const sorted = [...back.tracks[0].tabNotes].sort(
      (a, b) => a.tick - b.tick || a.string - b.string
    );
    expect(sorted.map((n) => n.velocity)).toEqual([64, 21, undefined]);
  });
});
