import { ChordMode } from "@/app/data/chordModes";
import { ChordOrNote } from "@/app/engine/eventsByTick";
import { fromPitch } from "./geometry";
import { createNoteEvent, getEventPitch, withPitch } from "./pianoRollEvent";

const major: ChordMode = { name: "", extensions: [] } as unknown as ChordMode;
const minor: ChordMode = { name: "m", extensions: [] } as unknown as ChordMode;
// jest.mock factories run before the constants of this file exist, so the names sit in a hoisted function
function mockNoteNames() {
  return ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
}

let nextId = 0;
jest.mock("@/app/engine/eventIdGenerator", () => ({
  IdGenerator: { generate: (prefix = "") => `${prefix}${nextId++}` },
}));
jest.mock("@/app/engine/eventBus", () => ({
  DEFAULT_NOTE_TRACK_NUMBER: 0,
  DEFAULT_CHORD_TRACK_NUMBER: 1,
}));
jest.mock("@/app/data/chordModes", () => ({
  chordModeOrder: ["", "m"],
  getModeSuffix: (chord: string) => chord.substring(chord[1] === "#" ? 2 : 1),
  getChordName: (note: number, mode: { name: string }) =>
    mockNoteNames()[note] + mode.name,
}));
// C has major and minor, D only minor, E has no chords
jest.mock("@/app/engine/chords/chordModesByNote", () => ({
  getModesForNote: (note: number) =>
    note === 0
      ? new Set([major, minor])
      : note === 2
        ? new Set([minor])
        : undefined,
}));
// the neck plays octaves 2 to 5 on strings 1 and 2
jest.mock("@/app/engine/generateNeckRepresentation", () => {
  const map = new Map();
  for (let octave = 2; octave <= 5; octave++) {
    mockNoteNames().forEach((name, note) =>
      map.set(`${name}${octave}`, [
        { octave, note, string: 1, fret: note },
        { octave, note, string: 2, fret: note + 5 },
      ]),
    );
  }
  return { octaveNoteToStringOctaveNoteMap: map };
});
jest.mock("@/app/data/notes", () => ({
  ...jest.requireActual("@/app/data/notes"),
  serializeOctaveNote: ({ note, octave }: { note: number; octave: number }) =>
    mockNoteNames()[note] + octave,
}));

const C3 = 36;
const D3 = 38;
const E3 = 40;
const C4 = 48;
const C6 = 72;

const noteAt = (pitch: number, string = 1): ChordOrNote => ({
  id: "n",
  note: { note: { ...fromPitch(pitch), string, fret: 0 }, trackNumber: 0 },
});

const chordAt = (pitch: number, mode: ChordMode): ChordOrNote => {
  const octaveNote = fromPitch(pitch);
  return {
    id: "c",
    chord: {
      chord: mockNoteNames()[octaveNote.note] + mode.name,
      metadata: { chordMode: mode, octaveNote },
    },
  };
};

describe("getEventPitch", () => {
  it("reads the pitch of a note", () => {
    expect(getEventPitch(noteAt(C4 + 3))).toBe(C4 + 3);
  });

  it("reads the root of a chord", () => {
    expect(getEventPitch(chordAt(D3, minor))).toBe(D3);
  });

  it("puts a chord without a root octave in octave 3", () => {
    const event: ChordOrNote = {
      id: "c",
      chord: { chord: "Am", metadata: {} },
    };
    expect(getEventPitch(event)).toBe(3 * 12 + 9);
  });
});

describe("withPitch", () => {
  it("gives the same event back when the pitch stays", () => {
    const event = noteAt(C4);
    expect(withPitch(event, C4)).toEqual({ event, chordModeChanged: false });
  });

  it("moves a note and keeps its string", () => {
    const result = withPitch(noteAt(C4, 2), C4 + 2);
    expect(result?.event.note?.note).toEqual({
      octave: 4,
      note: 2,
      string: 2,
      fret: 7,
    });
    expect(result?.chordModeChanged).toBe(false);
  });

  it("refuses a note pitch off the neck", () => {
    expect(withPitch(noteAt(C4), C6)).toBeUndefined();
  });

  it("moves a chord and keeps its mode", () => {
    const result = withPitch(chordAt(C3, minor), D3);
    expect(result?.event.chord?.chord).toBe("Dm");
    expect(result?.event.chord?.metadata.octaveNote).toEqual(fromPitch(D3));
    expect(result?.chordModeChanged).toBe(false);
  });

  it("takes the first mode when the root lacks the old one", () => {
    const result = withPitch(chordAt(C3, major), D3);
    expect(result?.event.chord?.chord).toBe("Dm");
    expect(result?.chordModeChanged).toBe(true);
  });

  it("refuses a chord root with no modes", () => {
    expect(withPitch(chordAt(C3, major), E3)).toBeUndefined();
  });

  it("switches the mode at the same pitch", () => {
    const result = withPitch(chordAt(C3, major), C3, minor);
    expect(result?.event.chord?.chord).toBe("Cm");
    expect(result?.chordModeChanged).toBe(false);
  });
});

describe("createNoteEvent", () => {
  it("puts a new note on the first string that plays it", () => {
    const event = createNoteEvent(C4, 16);
    expect(event?.duration).toBe(16);
    expect(event?.note).toEqual({
      note: { octave: 4, note: 0, string: 1, fret: 0 },
      trackNumber: 0,
      instrument: undefined,
      looperChannel: undefined,
    });
    expect(event?.id).toMatch(/^note-t0-4-C-/);
  });

  it("copies the track and looper channel from the template", () => {
    const event = createNoteEvent(C4, 8, { trackNumber: 3, looperChannel: 2 });
    expect(event?.note?.trackNumber).toBe(3);
    expect(event?.note?.looperChannel).toBe(2);
  });

  it("refuses a pitch off the neck", () => {
    expect(createNoteEvent(C6, 16)).toBeUndefined();
  });
});
