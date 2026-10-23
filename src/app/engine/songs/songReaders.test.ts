import { Note } from "@/app/data/notes";
import fs from "fs";
import { AnyEvent, write } from "midifile-ts";
import { matchChordMode } from "./chordNameMatcher";
import { readGuitarProSong } from "./gpReader";
import { readMidiSong } from "./midiReader";
import { normalizeChordName } from "./songHelpers";

const NUMB = "public/songs/Minor/Aeolian - Natural/Linkin Park - Numb.gp";

describe("readGuitarProSong", () => {
  it("keeps chords on the Chords track and the melody as tab", async () => {
    const song = await readGuitarProSong(
      new Uint8Array(fs.readFileSync(NUMB)),
      "Linkin Park - Numb.gp",
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
  channel = 0,
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
