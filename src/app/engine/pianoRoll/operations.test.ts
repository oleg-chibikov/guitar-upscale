import { Note } from "@/app/data/notes";
import { ChordOrNote, EventsByTick } from "@/app/engine/eventsByTick";
import { EditHistory } from "./editHistory";
import { fromPitch } from "./geometry";
import {
  deleteEvents,
  moveEvents,
  pasteEvents,
  quantizeEvents,
  resizeEvents,
  resolveMove,
  resolveResize,
  setChordMode,
} from "./operations";
import { getEventPitch } from "./pianoRollEvent";

const major = { name: "", extensions: [] };
const minor = { name: "m", extensions: [] };

let nextId = 0;
jest.mock("@/app/engine/eventIdGenerator", () => ({
  IdGenerator: { generate: (prefix = "") => `${prefix}${nextId++}` },
}));
jest.mock("@/app/engine/eventBus", () => ({ DEFAULT_NOTE_TRACK_NUMBER: 0 }));
jest.mock("@/app/data/chordModes", () => ({
  chordModeOrder: ["", "m"],
  getModeSuffix: (chord: string) => chord.substring(chord[1] === "#" ? 2 : 1),
  getChordName: (note: number, mode: { name: string }) =>
    ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"][note] +
    mode.name,
}));
// C has major and minor, D only minor, E has no chords
jest.mock("@/app/engine/chords/chordModesByNote", () => ({
  getModesForNote: (note: number) =>
    note === 0 ? new Set([major, minor]) : note === 2 ? new Set([minor]) : undefined,
}));
// the neck plays octaves 2 to 5
jest.mock("@/app/engine/generateNeckRepresentation", () => {
  const map = new Map();
  const names = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
  for (let octave = 2; octave <= 5; octave++) {
    names.forEach((name, note) =>
      map.set(`${name}${octave}`, [
        { octave, note, string: 1, fret: note },
        { octave, note, string: 2, fret: note + 5 },
      ])
    );
  }
  return { octaveNoteToStringOctaveNoteMap: map };
});
jest.mock("@/app/data/notes", () => ({
  ...jest.requireActual("@/app/data/notes"),
  serializeOctaveNote: ({ note, octave }: { note: number; octave: number }) =>
    ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"][note] +
    octave,
}));

const noteAt = (id: string, pitch: number, string = 1): ChordOrNote => ({
  id,
  note: { note: { ...fromPitch(pitch), string, fret: 0 }, trackNumber: 0 },
});

const C4 = 48;

const setup = () => {
  const data = new EventsByTick();
  data.insertEvent(0, noteAt("a", C4));
  data.insertEvent(16, noteAt("b", C4 + 2, 2));
  return { data, history: new EditHistory(data) };
};

describe("piano roll operations", () => {
  it("moves notes and undoes the move", () => {
    const { data, history } = setup();
    const targets = resolveMove(data, ["a", "b"], 8, 1);
    const { command } = moveEvents(data, targets, false);
    history.execute(command!);

    expect(data.getEvent("a")?.tick).toBe(8);
    expect(getEventPitch(data.getEvent("a")!.event)).toBe(C4 + 1);
    // keeps the string the note was on
    expect(data.getEvent("b")?.event.note?.note.string).toBe(2);

    history.undo();
    expect(data.getEvent("a")?.tick).toBe(0);
    expect(getEventPitch(data.getEvent("a")!.event)).toBe(C4);

    history.redo();
    expect(data.getEvent("b")?.tick).toBe(24);
  });

  it("stops the earliest note at tick zero and keeps the spacing", () => {
    const { data } = setup();
    const targets = resolveMove(data, ["a", "b"], -10, 0);
    expect(targets.get("a")?.tick).toBe(0);
    expect(targets.get("b")?.tick).toBe(16);
  });

  it("snaps the pitch to the scale", () => {
    const { data } = setup();
    const scale = new Set([Note.C, Note.D, Note.E]);
    const targets = resolveMove(data, ["a"], 0, 1, scale);
    expect(targets.get("a")?.pitch).toBe(C4 + 2);
  });

  it("keeps the pitch when a note leaves the neck", () => {
    const { data } = setup();
    const targets = resolveMove(data, ["a"], 4, 60);
    expect(targets.get("a")).toEqual({ tick: 4, pitch: C4 });
  });

  it("copies under new ids and undoes the copy", () => {
    const { data, history } = setup();
    const result = moveEvents(data, resolveMove(data, ["a"], 32, 0), true);
    history.execute(result.command!);
    expect(data.size).toBe(3);
    expect(result.selection[0]).not.toBe("a");
    history.undo();
    expect(data.size).toBe(2);
  });

  it("deletes and restores", () => {
    const { data, history } = setup();
    history.execute(deleteEvents(data, ["a"]).command!);
    expect(data.getEvent("a")).toBeUndefined();
    history.undo();
    expect(data.getEvent("a")?.tick).toBe(0);
  });

  it("resizes the end to the grid and keeps a minimum length", () => {
    const { data } = setup();
    const longer = resolveResize(data, ["a"], "a", "end", 5, 8);
    expect(longer.get("a")?.duration).toBe(24);
    const tiny = resolveResize(data, ["a"], "a", "end", -100, 8);
    expect(tiny.get("a")?.duration).toBe(8);
  });

  it("moves the start and keeps the end", () => {
    const { data, history } = setup();
    const targets = resolveResize(data, ["b"], "b", "start", 4, 4);
    history.execute(resizeEvents(data, targets).command!);
    expect(data.getEvent("b")?.tick).toBe(20);
    expect(data.getEvent("b")?.event.duration).toBe(12);
  });

  it("quantizes", () => {
    const data = new EventsByTick();
    data.insertEvent(5, noteAt("a", C4));
    data.insertEvent(13, noteAt("b", C4));
    const { command } = quantizeEvents(data, ["a", "b"], 8);
    new EditHistory(data).execute(command!);
    expect(data.getEvent("a")?.tick).toBe(8);
    expect(data.getEvent("b")?.tick).toBe(16);
  });

  it("pastes at a tick", () => {
    const { data } = setup();
    const clipboard = [data.getEvent("a")!, data.getEvent("b")!];
    const result = pasteEvents(data, clipboard, 64);
    new EditHistory(data).execute(result.command!);
    const ticks = result.selection.map((id) => data.getEvent(id)?.tick);
    expect(ticks).toEqual([64, 80]);
  });

  describe("chords", () => {
    const chordAt = (id: string, chord: string, pitch: number): ChordOrNote => ({
      id,
      chord: { chord, metadata: { octaveNote: fromPitch(pitch) } },
    });

    it("keeps the mode when the new root has it", () => {
      const data = new EventsByTick();
      data.insertEvent(0, chordAt("c", "Cm", C4));
      const result = moveEvents(data, resolveMove(data, ["c"], 0, 2), false);
      new EditHistory(data).execute(result.command!);
      expect(data.getEvent("c")?.event.chord?.chord).toBe("Dm");
      expect(result.chordsWithChangedMode).toEqual([]);
    });

    it("switches mode and reports it when the root lacks it", () => {
      const data = new EventsByTick();
      data.insertEvent(0, chordAt("c", "C", C4));
      const result = moveEvents(data, resolveMove(data, ["c"], 0, 2), false);
      new EditHistory(data).execute(result.command!);
      expect(data.getEvent("c")?.event.chord?.chord).toBe("Dm");
      expect(result.chordsWithChangedMode).toEqual(["c"]);
    });

    it("doesn't move a chord to a root without chords", () => {
      const data = new EventsByTick();
      data.insertEvent(0, chordAt("c", "C", C4));
      expect(resolveMove(data, ["c"], 0, 4).get("c")?.pitch).toBe(C4);
    });

    it("changes the mode", () => {
      const data = new EventsByTick();
      data.insertEvent(0, chordAt("c", "C", C4));
      const result = setChordMode(data, "c", minor as never);
      new EditHistory(data).execute(result.command!);
      expect(data.getEvent("c")?.event.chord?.chord).toBe("Cm");
    });
  });
});
